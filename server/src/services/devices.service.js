import { hashSecret } from "../utils/hash.js";
import { pool } from "../db.js";

const ONLINE_TTL_MS = 90 * 1000;

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
		userId: device.user_id,
		deviceCode: device.device_code,
		displayName: device.display_name,
		thresholdMoisture: device.threshold_moisture,
		mode: device.mode,
		minPumpOffSec: device.min_pump_off_sec,
		maxPumpOnSec: device.max_pump_on_sec,
		online: isOnline(device.last_seen_at),
		lastSeenAt: device.last_seen_at,
		isActive: device.is_active,
		createdAt: device.created_at,
	};
}

export async function getDeviceByCode(deviceCode) {
	try {
		const result = await pool.query(
			"SELECT id, user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec, is_active, created_at FROM devices WHERE device_code = $1",
			[deviceCode]
		);
		return result.rows[0] || null;
	} catch (error) {
		throw error;
	}
}

export async function getDeviceById(deviceId) {
	try {
		const result = await pool.query(
			"SELECT id, user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec, is_active, created_at FROM devices WHERE id = $1",
			[deviceId]
		);
		const device = result.rows[0];
		if (device) {
			const statusResult = await pool.query(
				"SELECT last_seen_at FROM device_status WHERE device_id = $1",
				[deviceId]
			);
			device.last_seen_at = statusResult.rows[0]?.last_seen_at || null;
		}
		return device || null;
	} catch (error) {
		throw error;
	}
}

export async function listDevicesByUser(userId) {
	try {
		const result = await pool.query(
			"SELECT d.id, d.user_id, d.device_code, d.display_name, d.device_secret_hash, d.threshold_moisture, d.mode, d.min_pump_off_sec, d.max_pump_on_sec, d.is_active, d.created_at, ds.last_seen_at FROM devices d LEFT JOIN device_status ds ON d.id = ds.device_id WHERE d.user_id = $1 ORDER BY d.created_at DESC",
			[userId]
		);
		return result.rows.map(toDeviceView);
	} catch (error) {
		throw error;
	}
}

export async function addDevice(userId, payload) {
	const {
		deviceCode,
		displayName,
		deviceSecret,
		thresholdMoisture = 45,
		mode = "AUTO",
		minPumpOffSec = 300,
		maxPumpOnSec = 120,
	} = payload;

	try {
		// Check if device code already exists
		const existing = await pool.query(
			"SELECT id FROM devices WHERE device_code = $1",
			[deviceCode]
		);
		if (existing.rows.length > 0) {
			const error = new Error("Device code already exists");
			error.code = "CONFLICT";
			throw error;
		}

		const result = await pool.query(
			"INSERT INTO devices(user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec, is_active, created_at",
			[userId, deviceCode, displayName, hashSecret(deviceSecret), thresholdMoisture, mode, minPumpOffSec, maxPumpOnSec]
		);

		const device = result.rows[0];
		return device;
	} catch (error) {
		throw error;
	}
}

export async function updateDeviceByOwner(userId, deviceId, payload) {
	try {
		const device = await pool.query(
			"SELECT id FROM devices WHERE id = $1 AND user_id = $2",
			[deviceId, userId]
		);

		if (device.rows.length === 0) {
			return null;
		}

		const { displayName, thresholdMoisture, isActive, mode, minPumpOffSec, maxPumpOnSec } = payload;

		const updates = [];
		const values = [];
		let paramNum = 1;

		if (displayName !== undefined) {
			updates.push(`display_name = $${paramNum++}`);
			values.push(displayName);
		}
		if (thresholdMoisture !== undefined) {
			updates.push(`threshold_moisture = $${paramNum++}`);
			values.push(Number(thresholdMoisture));
		}
		if (isActive !== undefined) {
			updates.push(`is_active = $${paramNum++}`);
			values.push(Boolean(isActive));
		}
		if (mode !== undefined) {
			updates.push(`mode = $${paramNum++}`);
			values.push(mode);
		}
		if (minPumpOffSec !== undefined) {
			updates.push(`min_pump_off_sec = $${paramNum++}`);
			values.push(Number(minPumpOffSec));
		}
		if (maxPumpOnSec !== undefined) {
			updates.push(`max_pump_on_sec = $${paramNum++}`);
			values.push(Number(maxPumpOnSec));
		}

		if (updates.length === 0) {
			return await getDeviceById(deviceId);
		}

		// Add deviceId as the last parameter
		values.push(deviceId);
		values.push(userId);

		const query = `UPDATE devices SET ${updates.join(", ")} WHERE id = $${paramNum} AND user_id = $${paramNum + 1} RETURNING id, user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec, is_active, created_at`;

		const result = await pool.query(query, values);
		return result.rows[0] || null;
	} catch (error) {
		throw error;
	}
}

export async function deleteDeviceByOwner(userId, deviceId) {
	try {
		const result = await pool.query(
			"DELETE FROM devices WHERE id = $1 AND user_id = $2 RETURNING id",
			[deviceId, userId]
		);
		return result.rows.length > 0;
	} catch (error) {
		throw error;
	}
}

export async function getOwnedDevice(userId, deviceId) {
	try {
		const result = await pool.query(
			"SELECT id, user_id, device_code, display_name, device_secret_hash, threshold_moisture, mode, min_pump_off_sec, max_pump_on_sec, is_active, created_at FROM devices WHERE id = $1 AND user_id = $2",
			[deviceId, userId]
		);
		const device = result.rows[0];
		if (device) {
			const statusResult = await pool.query(
				"SELECT last_seen_at FROM device_status WHERE device_id = $1",
				[deviceId]
			);
			device.last_seen_at = statusResult.rows[0]?.last_seen_at || null;
		}
		return device || null;
	} catch (error) {
		throw error;
	}
}

export async function createCommandForDevice(deviceId, payload) {
	try {
		const commandId = `cmd_${Date.now()}`;
		const now = new Date().toISOString();

		const result = await pool.query(
			"INSERT INTO commands(id, device_id, type, duration_sec, status, issued_at) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, device_id, type, duration_sec, status, issued_at, delivered_at, result_at, detail",
			[commandId, deviceId, payload.type, payload.durationSec || null, "QUEUED", now]
		);

		const command = result.rows[0];
		return {
			id: command.id,
			deviceId: command.device_id,
			type: command.type,
			durationSec: command.duration_sec,
			status: command.status,
			issuedAt: command.issued_at,
			deliveredAt: command.delivered_at,
			resultAt: command.result_at,
			detail: command.detail,
		};
	} catch (error) {
		throw error;
	}
}

export async function listCommandsForDevice(deviceId, status) {
	try {
		let query = "SELECT id, device_id, type, duration_sec, status, issued_at, delivered_at, result_at, detail FROM commands WHERE device_id = $1";
		const params = [deviceId];

		if (status) {
			query += " AND status = $2";
			params.push(status);
		}

		query += " ORDER BY issued_at DESC";

		const result = await pool.query(query, params);
		return result.rows.map((cmd) => ({
			id: cmd.id,
			deviceId: cmd.device_id,
			type: cmd.type,
			durationSec: cmd.duration_sec,
			status: cmd.status,
			issuedAt: cmd.issued_at,
			deliveredAt: cmd.delivered_at,
			resultAt: cmd.result_at,
			detail: cmd.detail,
		}));
	} catch (error) {
		throw error;
	}
}

export async function getIrrigationsForDevice(deviceId) {
	try {
		const result = await pool.query(
			"SELECT id, device_id, started_at, ended_at, duration_sec, moisture_before, moisture_after, reason, created_at FROM irrigation_logs WHERE device_id = $1 ORDER BY started_at DESC",
			[deviceId]
		);
		return result.rows;
	} catch (error) {
		throw error;
	}
}

export async function addIrrigationLog(deviceId, payload) {
	try {
		const result = await pool.query(
			"INSERT INTO irrigation_logs(device_id, started_at, ended_at, duration_sec, moisture_before, moisture_after, reason) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id, device_id, started_at, ended_at, duration_sec, moisture_before, moisture_after, reason, created_at",
			[
				deviceId,
				toIsoOrNow(payload.startedAt),
				toIsoOrNow(payload.endedAt),
				Number(payload.durationSec),
				payload.moistureBefore ?? null,
				payload.moistureAfter ?? null,
				payload.reason || "AUTO",
			]
		);
		return result.rows[0];
	} catch (error) {
		throw error;
	}
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

export async function getStatsForDevice(deviceId, range = "week", metric = "duration") {
	try {
		const allowedRange = ["day", "week", "month"];
		const selectedRange = allowedRange.includes(range) ? range : "week";
		const selectedMetric = metric === "count" ? "count" : "duration";

		const start = getStartDate(selectedRange);

		let query = "SELECT started_at, duration_sec FROM irrigation_logs WHERE device_id = $1 AND started_at >= $2 ORDER BY started_at ASC";
		const result = await pool.query(query, [deviceId, start.toISOString()]);

		const buckets = new Map();
		for (const item of result.rows) {
			const key = item.started_at.slice(0, 10);
			const current = buckets.get(key) || 0;
			const delta = selectedMetric === "duration" ? Number(item.duration_sec) / 60 : 1;
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
	} catch (error) {
		throw error;
	}}