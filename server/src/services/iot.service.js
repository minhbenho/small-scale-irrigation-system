import {
	addIrrigationLog,
	getDeviceByCode,
	listCommandsForDevice,
	getStores,
} from "./devices.service.js";
import { compareHashedSecret } from "../utils/hash.js";

export function authenticateDeviceByHeaders(deviceCode, rawSecret, rawToken) {
	if (!deviceCode) {
		return { ok: false, reason: "missing_device_code" };
	}

	const device = getDeviceByCode(deviceCode);
	if (!device || !device.isActive) {
		return { ok: false, reason: "device_not_found" };
	}

	const tokenMatches = rawToken
		? compareHashedSecret(rawToken, device.tokenHash)
		: false;
	const secretMatches = rawSecret
		? compareHashedSecret(rawSecret, device.secretHash)
		: false;

	if (!tokenMatches && !secretMatches) {
		return { ok: false, reason: "invalid_credentials" };
	}

	return { ok: true, device };
}

export function updateHeartbeat(device, body) {
	device.lastSeenAt = new Date().toISOString();
	if (body?.fwVersion !== undefined) {
		device.fwVersion = body.fwVersion;
	}
	if (body?.ip !== undefined) {
		device.ip = body.ip;
	}

	return {
		ok: true,
		serverTime: new Date().toISOString(),
	};
}

export function saveIrrigation(device, payload) {
	const log = addIrrigationLog(device.id, payload);
	return {
		ok: true,
		logId: log.id,
	};
}

export function pullConfig(device) {
	return {
		thresholdMoisture: device.thresholdMoisture,
		mode: device.mode || "AUTO",
		minPumpOffSec: device.minPumpOffSec ?? 300,
		maxPumpOnSec: device.maxPumpOnSec ?? 120,
	};
}

export function pullCommand(device, ack = false) {
	const pending = listCommandsForDevice(device.id, "QUEUED")[0] || null;
	if (!pending) {
		return { command: null };
	}

	if (ack) {
		pending.status = "DELIVERED";
		pending.deliveredAt = new Date().toISOString();
	}

	return {
		command: {
			id: pending.id,
			type: pending.type,
			durationSec: pending.durationSec,
			issuedAt: pending.issuedAt,
		},
	};
}

export function saveCommandResult(device, commandId, payload) {
	const { commandsStore } = getStores();
	const command = commandsStore.find(
		(item) => item.id === commandId && item.deviceId === device.id
	);

	if (!command) {
		return { notFound: true };
	}

	command.status = payload?.status || "DONE";
	command.detail = payload?.detail || null;
	command.resultAt = new Date().toISOString();

	return {
		ok: true,
		commandId: command.id,
		status: command.status,
	};
}
