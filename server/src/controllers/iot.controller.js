import {
  updateHeartbeat,
  saveIrrigation,
  pullConfig,
  pullCommand as pullCommandService,
  saveCommandResult,
} from "../services/iot.service.js";

export const heartbeat = async (req, res) => {
  try {
    const payload = await updateHeartbeat(req.device, req.body);
  return res.status(200).json(payload);
  } catch (error) {
    console.error("[IoT Controller] Heartbeat error:", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
};

export const pushIrrigation = async (req, res) => {
  try {
  const { startedAt, endedAt, durationSec } = req.body;

  if (!durationSec) {
    return res.status(400).json({
      ok: false,
      code: "INVALID_REQUEST",
      message: "durationSec is required",
    });
  }

    const result = await saveIrrigation(req.device, {
    startedAt,
    endedAt,
    durationSec,
    moistureBefore: req.body.moistureBefore,
    moistureAfter: req.body.moistureAfter,
    reason: req.body.reason,
  });

  return res.status(200).json(result);
  } catch (error) {
    console.error("[IoT Controller] Push irrigation error:", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
};

export const getConfig = async (req, res) => {
  try {
    const config = await pullConfig(req.device);
    return res.status(200).json(config);
  } catch (error) {
    console.error("[IoT Controller] Get config error:", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
};

export const pullCommand = async (req, res) => {
  try {
  const ack = String(req.query.ack || "false").toLowerCase() === "true";
    const result = await pullCommandService(req.device, ack);
    return res.status(200).json(result);
  } catch (error) {
    console.error("[IoT Controller] Pull command error:", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
};

export const commandResult = async (req, res) => {
  try {
  const { commandId } = req.params;
    const result = await saveCommandResult(req.device, commandId, req.body);

  if (result.notFound) {
    return res.status(404).json({
      ok: false,
      code: "NOT_FOUND",
      message: "Command not found",
    });
  }

  return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[IoT Controller] Command result error:", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
};
