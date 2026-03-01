import {
  updateHeartbeat,
  saveIrrigation,
  pullConfig,
  pullCommand as pullCommandService,
  saveCommandResult,
} from "../services/iot.service.js";

export const heartbeat = (req, res) => {
  const payload = updateHeartbeat(req.device, req.body);
  return res.status(200).json(payload);
};

export const pushIrrigation = (req, res) => {
  const { startedAt, endedAt, durationSec } = req.body;

  if (!durationSec) {
    return res.status(400).json({
      ok: false,
      code: "INVALID_REQUEST",
      message: "durationSec is required",
    });
  }

  const result = saveIrrigation(req.device, {
    startedAt,
    endedAt,
    durationSec,
    moistureBefore: req.body.moistureBefore,
    moistureAfter: req.body.moistureAfter,
    reason: req.body.reason,
  });

  return res.status(200).json(result);
};

export const getConfig = (req, res) => {
  return res.status(200).json(pullConfig(req.device));
};

export const pullCommand = (req, res) => {
  const ack = String(req.query.ack || "false").toLowerCase() === "true";
  return res.status(200).json(pullCommandService(req.device, ack));
};

export const commandResult = (req, res) => {
  const { commandId } = req.params;
  const result = saveCommandResult(req.device, commandId, req.body);

  if (result.notFound) {
    return res.status(404).json({
      ok: false,
      code: "NOT_FOUND",
      message: "Command not found",
    });
  }

  return res.status(200).json({ ok: true });
};
