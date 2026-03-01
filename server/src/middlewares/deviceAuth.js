import { authenticateDeviceByHeaders } from "../services/iot.service.js";

export function requireDeviceAuth(req, res, next) {
  const deviceCode = req.header("X-Device-Code");
  const deviceSecret = req.header("X-Device-Secret");
  const deviceToken = req.header("X-Device-Token");

  const result = authenticateDeviceByHeaders(deviceCode, deviceSecret, deviceToken);

  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      code: "DEVICE_UNAUTHORIZED",
      reason: result.reason,
    });
  }

  req.device = result.device;
  return next();
}