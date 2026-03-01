import { authenticateDeviceByHeaders } from "../services/iot.service.js";

export async function requireDeviceAuth(req, res, next) {
  const deviceCode = req.header("X-Device-Code");
  const deviceSecret = req.header("X-Device-Secret");
  const deviceToken = req.header("X-Device-Token");

  try {
    const result = await authenticateDeviceByHeaders(deviceCode, deviceSecret, deviceToken);

    if (!result.ok) {
      return res.status(401).json({
        ok: false,
        code: "DEVICE_UNAUTHORIZED",
        reason: result.reason,
      });
    }

    req.device = result.device;
    return next();
  } catch (error) {
    console.error("[Device Auth]", error.message);
    return res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
}