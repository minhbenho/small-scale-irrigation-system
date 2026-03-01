import {
	addIrrigationLog,
	getDeviceByCode,
	listCommandsForDevice,
} from "./devices.service.js";
import { compareHashedSecret } from "../utils/hash.js";
import { pool } from "../db.js";

export async function authenticateDeviceByHeaders(deviceCode, rawSecret, rawToken) {
	if (!deviceCode) {
		return { ok: false, reason: "missing_device_code" };
	}

	try {
		const device = await getDeviceByCode(deviceCode);
		if (!device || !device.is_active) {
			return { ok: false, reason: "device_not_found" };
		}

		const secretMatches = rawSecret
			? compareHashedSecret(rawSecret, device.device_secret_hash)
			: false;

		if (!secretMatches) {
			return { ok: false, reason: "invalid_credentials" };
		}

		return { ok: true, device };
	} catch (error) {
		return { ok: false, reason: "auth_error" };
	}
}

export async function updateHeartbeat(device, body) {
	try {
		const now = new Date().toISOString();
		await pool.query(
			"INSERT INTO device_status(device_id, last_seen_at, ip, fw_version) VALUES($1, $2, $3, $4) ON CONFLICT(device_id) DO UPDATE SET last_seen_at=$2, ip=$3, fw_version=$4, updated_at=now()",
			[device.id, now, body?.ip || null, body?.fwVersion || null]
		);

		return {
			ok: true,
			serverTime: now,
		};
	} catch (error) {
		console.error("[IoT] Heartbeat error:", error.message);
		throw error;
	}
}

export async function saveIrrigation(device, payload) {
	try {
		const log = await addIrrigationLog(device.id, payload);
		return {
			ok: true,
			logId: log.id,
		};
	} catch (error) {
		console.error("[IoT] Save irrigation error:", error.message);
		throw error;
	}
}

export async function pullConfig(device) {
	return {
		thresholdMoisture: device.threshold_moisture,
		mode: device.mode || "AUTO",
		minPumpOffSec: device.min_pump_off_sec ?? 300,
		maxPumpOnSec: device.max_pump_on_sec ?? 120,
	};
}

export async function pullCommand(device, ack = false) {
	try {
		const commands = await listCommandsForDevice(device.id, "QUEUED");
		const pending = commands[0] || null;

		if (!pending) {
			return { command: null };
		}

		if (ack) {
			await pool.query(
				"UPDATE commands SET status=$1, delivered_at=$2 WHERE id=$3",
				["DELIVERED", new Date().toISOString(), pending.id]
			);
		}

		return {
			command: {
				id: pending.id,
				type: pending.type,
				durationSec: pending.durationSec,
				issuedAt: pending.issuedAt,
			},
		};
	} catch (error) {
		console.error("[IoT] Pull command error:", error.message);
		throw error;
	}
}

export async function saveCommandResult(device, commandId, payload) {
	try {
		const result = await pool.query(
			"UPDATE commands SET status=$1, detail=$2, result_at=$3 WHERE id=$4 AND device_id=$5 RETURNING id, status",
			[payload?.status || "DONE", payload?.detail || null, new Date().toISOString(), commandId, device.id]
		);

		if (result.rows.length === 0) {
			return { notFound: true };
		}

		return {
			ok: true,
			commandId: result.rows[0].id,
			status: result.rows[0].status,
		};
	} catch (error) {
		console.error("[IoT] Save command result error:", error.message);
		throw error;
	}
}