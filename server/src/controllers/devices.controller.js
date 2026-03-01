// Mock data store
const devicesStore = [
  {
    id: "dev-001",
    userId: "user-123",
    deviceCode: "esp32-01",
    displayName: "Chậu lan",
    thresholdMoisture: 40,
    online: true,
    lastSeenAt: "2026-02-28T08:30:00Z",
    isActive: true,
    createdAt: "2026-02-20T10:00:00Z",
  },
];

// GET /api/devices
export const listDevices = (req, res) => {
  const userId = req.user.id;
  const devices = devicesStore.filter((d) => d.userId === userId);

  res.status(200).json(devices);
};

// POST /api/devices
export const addDevice = (req, res) => {
  const { deviceCode, displayName, deviceSecret, thresholdMoisture } =
    req.body;

  // Validate
  if (!deviceCode || !displayName || !deviceSecret) {
    return res.status(400).json({
      message: "deviceCode, displayName, and deviceSecret are required",
      code: "INVALID_REQUEST",
    });
  }

  const newDevice = {
    id: "dev-" + Date.now(),
    userId: req.user.id,
    deviceCode,
    displayName,
    thresholdMoisture: thresholdMoisture || 40,
    online: false,
    lastSeenAt: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  devicesStore.push(newDevice);

  res.status(201).json({
    id: newDevice.id,
    deviceCode: newDevice.deviceCode,
  });
};

// PATCH /api/devices/:deviceId
export const updateDevice = (req, res) => {
  const { deviceId } = req.params;
  const { displayName, thresholdMoisture, isActive } = req.body;

  const device = devicesStore.find(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  if (displayName !== undefined) device.displayName = displayName;
  if (thresholdMoisture !== undefined)
    device.thresholdMoisture = thresholdMoisture;
  if (isActive !== undefined) device.isActive = isActive;

  res.status(200).json({
    id: device.id,
    deviceCode: device.deviceCode,
    displayName: device.displayName,
    thresholdMoisture: device.thresholdMoisture,
    isActive: device.isActive,
  });
};

// DELETE /api/devices/:deviceId
export const deleteDevice = (req, res) => {
  const { deviceId } = req.params;

  const index = devicesStore.findIndex(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  devicesStore.splice(index, 1);

  res.status(200).json({
    message: "Device deleted successfully",
  });
};

// GET /api/devices/:deviceId/irrigations
export const listIrrigations = (req, res) => {
  const { deviceId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  const device = devicesStore.find(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  // Mock irrigations
  const mockIrrigations = [
    {
      id: 123,
      startedAt: "2026-02-28T01:10:00Z",
      endedAt: "2026-02-28T01:12:00Z",
      durationSec: 120,
      moistureBefore: 32,
      moistureAfter: 48,
      reason: "AUTO",
    },
    {
      id: 122,
      startedAt: "2026-02-27T06:00:00Z",
      endedAt: "2026-02-27T06:02:30Z",
      durationSec: 150,
      moistureBefore: 28,
      moistureAfter: 52,
      reason: "AUTO",
    },
  ];

  const items = mockIrrigations.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

  res.status(200).json({
    items,
    total: mockIrrigations.length,
  });
};

// GET /api/devices/:deviceId/stats
export const getStats = (req, res) => {
  const { deviceId } = req.params;
  const { range = "week", metric = "duration" } = req.query;

  const device = devicesStore.find(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  // Mock stats data
  const mockSeries =
    metric === "duration"
      ? [
          { bucket: "2026-02-22", value: 12.5 },
          { bucket: "2026-02-23", value: 0 },
          { bucket: "2026-02-24", value: 8.0 },
          { bucket: "2026-02-25", value: 15.3 },
          { bucket: "2026-02-26", value: 10.0 },
          { bucket: "2026-02-27", value: 9.5 },
          { bucket: "2026-02-28", value: 2.0 },
        ]
      : [
          { bucket: "2026-02-22", value: 3 },
          { bucket: "2026-02-23", value: 0 },
          { bucket: "2026-02-24", value: 2 },
          { bucket: "2026-02-25", value: 4 },
          { bucket: "2026-02-26", value: 2 },
          { bucket: "2026-02-27", value: 2 },
          { bucket: "2026-02-28", value: 1 },
        ];

  res.status(200).json({
    range,
    metric,
    unit: metric === "duration" ? "minutes" : "count",
    series: mockSeries,
  });
};

// POST /api/devices/:deviceId/commands
export const createCommand = (req, res) => {
  const { deviceId } = req.params;
  const { type, durationSec } = req.body;

  const device = devicesStore.find(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

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

  const commandId = "cmd-" + Date.now();

  res.status(201).json({
    commandId,
    status: "QUEUED",
  });
};

// GET /api/devices/:deviceId/commands
export const listCommands = (req, res) => {
  const { deviceId } = req.params;
  const { status } = req.query;

  const device = devicesStore.find(
    (d) => d.id === deviceId && d.userId === req.user.id
  );

  if (!device) {
    return res.status(404).json({
      message: "Device not found",
      code: "NOT_FOUND",
    });
  }

  // Mock commands
  const mockCommands = [
    {
      id: "cmd-001",
      type: "PUMP_ON",
      durationSec: 60,
      status: "COMPLETED",
      createdAt: "2026-02-28T07:00:00Z",
      completedAt: "2026-02-28T07:01:00Z",
    },
    {
      id: "cmd-002",
      type: "PUMP_ON",
      durationSec: 120,
      status: "QUEUED",
      createdAt: "2026-02-28T08:00:00Z",
    },
  ];

  const filtered = status
    ? mockCommands.filter((c) => c.status === status)
    : mockCommands;

  res.status(200).json(filtered);
};
