import {
  addDevice as addDeviceService,
  createCommandForDevice,
  deleteDeviceByOwner,
  getIrrigationsForDevice,
  getOwnedDevice,
  getStatsForDevice,
  listCommandsForDevice,
  listDevicesByUser,
  toDeviceView,
  updateDeviceByOwner,
} from "../services/devices.service.js";

// GET /api/devices
export const listDevices = async (req, res) => {
  const userId = req.user.id;
  const items = await listDevicesByUser(userId);
  return res.status(200).json(items);
};

// POST /api/devices
export const addDevice = async (req, res) => {
  const { deviceCode, displayName, deviceSecret } = req.body;

  if (!deviceCode || !displayName || !deviceSecret) {
    return res.status(400).json({
      message: "deviceCode, displayName, and deviceSecret are required",
      code: "INVALID_REQUEST",
    });
  }

  let newDevice;
  try {
    newDevice = await addDeviceService(req.user.id, req.body);
  } catch (error) {
    return res.status(409).json({
      message: error.message,
      code: error.code || "CONFLICT",
    });
  }

  return res.status(201).json({
    id: newDevice.id,
    deviceCode: newDevice.device_code,
  });
};

// PATCH /api/devices/:deviceId
export const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await updateDeviceByOwner(req.user.id, deviceId, req.body);

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
        code: "NOT_FOUND",
      });
    }

    return res.status(200).json(toDeviceView(device));
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      code: "UPDATE_FAILED",
    });
  }
};

// DELETE /api/devices/:deviceId
export const deleteDevice = async (req, res) => {
  const { deviceId } = req.params;

  const deleted = await deleteDeviceByOwner(req.user.id, deviceId);
  if (!deleted) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  return res.status(200).json({
    message: "Device deleted successfully",
  });
};

// GET /api/devices/:deviceId/irrigations
export const listIrrigations = async (req, res) => {
  const { deviceId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const device = await getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  const all = await getIrrigationsForDevice(device.id);
  const safeOffset = Number(offset) || 0;
  const safeLimit = Number(limit) || 50;
  const items = all.slice(safeOffset, safeOffset + safeLimit);

  return res.status(200).json({
    items,
    total: all.length,
  });
};

// GET /api/devices/:deviceId/stats
export const getStats = async (req, res) => {
  const { deviceId } = req.params;
  const { range = "week", metric = "duration" } = req.query;

  const device = await getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  const stats = await getStatsForDevice(device.id, range, metric);
  return res.status(200).json(stats);
};

// POST /api/devices/:deviceId/commands
export const createCommand = async (req, res) => {
  const { deviceId } = req.params;
  const { type, durationSec } = req.body;

  const device = await getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  if (!type) {
    return res.status(400).json({
      message: "type is required",
      code: "INVALID_REQUEST",
    });
  }

  const command = await createCommandForDevice(device.id, { type, durationSec });

  return res.status(201).json({
    commandId: command.id,
    status: "QUEUED",
  });
};

// GET /api/devices/:deviceId/commands
export const listCommands = async (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.query;

  const device = await getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  const commands = await listCommandsForDevice(device.id, status);
  return res.status(200).json(commands);
};
