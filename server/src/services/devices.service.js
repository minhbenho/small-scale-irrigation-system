import { hashSecret } from "../utils/hash.js";

const ONLINE_TTL_MS = 90 * 1000;

const devicesStore = [
	{
		id: "dev-001",
		userId: "user-123",
		deviceCode: "esp32-01",
		displayName: "Chậu lan",
		secretHash: hashSecret("abc123"),
		tokenHash: null,
		thresholdMoisture: 45,
		mode: "AUTO",
		minPumpOffSec: 300,
		maxPumpOnSec: 120,
		isActive: true,
		lastSeenAt: null,
		createdAt: "2026-02-20T10:00:00Z",
	},
];

const commandsStore = [];
const irrigationsStore = [];
let irrigationIdSeq = 1;

function toIsoOrNow(value) {
	if (!value) {
		return new Date().toISOString();
	}
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export function isOnline(lastSeenAt) {
	if (!lastSeenAt) {
		return false;
	}
	const seen = new Date(lastSeenAt).getTime();
	if (Number.isNaN(seen)) {
		return false;
	}
	return Date.now() - seen <= ONLINE_TTL_MS;
}

export function toDeviceView(device) {
	return {
		id: device.id,
		userId: device.userId,
		deviceCode: device.deviceCode,
		displayName: device.displayName,
		thresholdMoisture: device.thresholdMoisture,
		mode: device.mode,
		minPumpOffSec: device.minPumpOffSec,
		maxPumpOnSec: device.maxPumpOnSec,
		online: isOnline(device.lastSeenAt),
		lastSeenAt: device.lastSeenAt,
		isActive: device.isActive,
		createdAt: device.createdAt,
	};
}

export function getDeviceByCode(deviceCode) {
	return devicesStore.find((d) => d.deviceCode === deviceCode) || null;
}

export function getDeviceById(deviceId) {
	return devicesStore.find((d) => d.id === deviceId) || null;
}

export function listDevicesByUser(userId) {
	return devicesStore.filter((d) => d.userId === userId).map(toDeviceView);
}

export function addDevice(userId, payload) {
	const {
		deviceCode,
		displayName,
		deviceSecret,
		thresholdMoisture = 45,
		mode = "AUTO",
		minPumpOffSec = 300,
		maxPumpOnSec = 120,
	} = payload;

	const exists = getDeviceByCode(deviceCode);
	if (exists) {
		const error = new Error("Device code already exists");
		error.code = "CONFLICT";
		throw error;
	}

	const now = new Date().toISOString();
	const item = {
		id: `dev-${Date.now()}`,
		userId,
		deviceCode,
		displayName,
		secretHash: hashSecret(deviceSecret),
		tokenHash: null,
		thresholdMoisture: Number(thresholdMoisture),
		mode,
		minPumpOffSec: Number(minPumpOffSec),
		maxPumpOnSec: Number(maxPumpOnSec),
		isActive: true,
		lastSeenAt: null,
		createdAt: now,
	};

	devicesStore.push(item);
	return item;
}

export function updateDeviceByOwner(userId, deviceId, payload) {
	const device = devicesStore.find((d) => d.id === deviceId && d.userId === userId);
	if (!device) {
		return null;
	}

	const { displayName, thresholdMoisture, isActive, mode, minPumpOffSec, maxPumpOnSec } = payload;

	if (displayName !== undefined) {
		device.displayName = displayName;
	}
	if (thresholdMoisture !== undefined) {
		device.thresholdMoisture = Number(thresholdMoisture);
	}
	if (isActive !== undefined) {
		device.isActive = Boolean(isActive);
	}
	if (mode !== undefined) {
		device.mode = mode;
	}
	if (minPumpOffSec !== undefined) {
		device.minPumpOffSec = Number(minPumpOffSec);
	}
	if (maxPumpOnSec !== undefined) {
		device.maxPumpOnSec = Number(maxPumpOnSec);
	}

	return device;
}

export function deleteDeviceByOwner(userId, deviceId) {
	const index = devicesStore.findIndex((d) => d.id === deviceId && d.userId === userId);
	if (index < 0) {
		return false;
	}
	devicesStore.splice(index, 1);
	return true;
}

export function getOwnedDevice(userId, deviceId) {
	return devicesStore.find((d) => d.id === deviceId && d.userId === userId) || null;
}

export function createCommandForDevice(deviceId, payload) {
	const now = new Date().toISOString();
	const command = {
		id: `cmd_${Date.now()}`,
		deviceId,
		type: payload.type,
		durationSec: payload.durationSec ? Number(payload.durationSec) : null,
		status: "QUEUED",
		issuedAt: now,
		deliveredAt: null,
		resultAt: null,
		detail: null,
	};

	commandsStore.push(command);
	return command;
}

export function listCommandsForDevice(deviceId, status) {
	return commandsStore
		.filter((c) => c.deviceId === deviceId)
		.filter((c) => (status ? c.status === status : true))
		.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

export function getIrrigationsForDevice(deviceId) {
	return irrigationsStore
		.filter((item) => item.deviceId === deviceId)
		.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function addIrrigationLog(deviceId, payload) {
	const now = new Date().toISOString();
	const item = {
		id: irrigationIdSeq++,
		deviceId,
		startedAt: toIsoOrNow(payload.startedAt),
		endedAt: toIsoOrNow(payload.endedAt),
		durationSec: Number(payload.durationSec),
		moistureBefore: payload.moistureBefore ?? null,
		moistureAfter: payload.moistureAfter ?? null,
		reason: payload.reason || "AUTO",
		createdAt: now,
	};

	irrigationsStore.push(item);
	return item;
}

function getStartDate(range) {
	const now = new Date();
	const start = new Date(now);
	if (range === "day") {
		start.setHours(0, 0, 0, 0);
		return start;
	}
	if (range === "month") {
		start.setDate(start.getDate() - 29);
		start.setHours(0, 0, 0, 0);
		return start;
	}
	start.setDate(start.getDate() - 6);
	start.setHours(0, 0, 0, 0);
	return start;
}

export function getStatsForDevice(deviceId, range = "week", metric = "duration") {
	const allowedRange = ["day", "week", "month"];
	const selectedRange = allowedRange.includes(range) ? range : "week";
	const selectedMetric = metric === "count" ? "count" : "duration";

	const start = getStartDate(selectedRange);
	const logs = getIrrigationsForDevice(deviceId).filter(
		(item) => new Date(item.startedAt).getTime() >= start.getTime()
	);

	const buckets = new Map();
	for (const item of logs) {
		const key = item.startedAt.slice(0, 10);
		const current = buckets.get(key) || 0;
		const delta = selectedMetric === "duration" ? Number(item.durationSec) / 60 : 1;
		buckets.set(key, current + delta);
	}

	const series = [...buckets.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([bucket, value]) => ({
			bucket,
			value: selectedMetric === "duration" ? Number(value.toFixed(2)) : value,
		}));

	return {
		range: selectedRange,
		metric: selectedMetric,
		unit: selectedMetric === "duration" ? "minutes" : "count",
		series,
	};
}

export function getStores() {
	return {
		devicesStore,
		commandsStore,
		irrigationsStore,
	};
}
