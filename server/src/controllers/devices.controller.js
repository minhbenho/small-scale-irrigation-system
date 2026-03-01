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
export const listDevices = (req, res) => {
  const userId = req.user.id;
  const items = listDevicesByUser(userId);
  return res.status(200).json(items);
};

// POST /api/devices
export const addDevice = (req, res) => {
  const { deviceCode, displayName, deviceSecret } = req.body;

  if (!deviceCode || !displayName || !deviceSecret) {
    return res.status(400).json({
      message: "deviceCode, displayName, and deviceSecret are required",
      code: "INVALID_REQUEST",
    });
  }

  let newDevice;
  try {
    newDevice = addDeviceService(req.user.id, req.body);
  } catch (error) {
    return res.status(409).json({
      message: error.message,
      code: error.code || "CONFLICT",
    });
  }

  return res.status(201).json({
    id: newDevice.id,
    deviceCode: newDevice.deviceCode,
  });
};

// PATCH /api/devices/:deviceId
export const updateDevice = (req, res) => {
  const { deviceId } = req.params;
  const device = updateDeviceByOwner(req.user.id, deviceId, req.body);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  return res.status(200).json(toDeviceView(device));
};

// DELETE /api/devices/:deviceId
export const deleteDevice = (req, res) => {
  const { deviceId } = req.params;

  const deleted = deleteDeviceByOwner(req.user.id, deviceId);
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
export const listIrrigations = (req, res) => {
  const { deviceId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const device = getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  const all = getIrrigationsForDevice(device.id);
  const safeOffset = Number(offset) || 0;
  const safeLimit = Number(limit) || 50;
  const items = all.slice(safeOffset, safeOffset + safeLimit);

  return res.status(200).json({
    items,
    total: all.length,
  });
};

// GET /api/devices/:deviceId/stats
export const getStats = (req, res) => {
  const { deviceId } = req.params;
  const { range = "week", metric = "duration" } = req.query;

  const device = getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  return res.status(200).json(getStatsForDevice(device.id, range, metric));
};

// POST /api/devices/:deviceId/commands
export const createCommand = (req, res) => {
  const { deviceId } = req.params;
  const { type, durationSec } = req.body;

  const device = getOwnedDevice(req.user.id, deviceId);

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

  const command = createCommandForDevice(device.id, { type, durationSec });

  return res.status(201).json({
    commandId: command.id,
    status: "QUEUED",
  });
};

// GET /api/devices/:deviceId/commands
export const listCommands = (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.query;

  const device = getOwnedDevice(req.user.id, deviceId);

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  return res.status(200).json(listCommandsForDevice(device.id, status));
};
