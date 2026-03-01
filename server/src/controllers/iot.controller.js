// Mock controller cho IoT devices
export const heartbeat = (req, res) => {
  const { soilMoisture, temperature } = req.body;
  res.json({
    success: true,
    message: "Heartbeat received",
    data: {
      deviceId: req.device.id,
      soilMoisture,
      temperature,
      timestamp: new Date().toISOString(),
    },
  });
};

export const pushIrrigation = (req, res) => {
  const { soilMoisture, temperature, duration } = req.body;
  res.status(201).json({
    success: true,
    message: "Irrigation data recorded",
    irrigation: {
      id: "irr-" + Date.now(),
      deviceId: req.device.id,
      soilMoisture,
      temperature,
      duration,
      timestamp: new Date().toISOString(),
    },
  });
};

export const getConfig = (req, res) => {
  res.json({
    config: {
      deviceId: req.device.id,
      soilMoistureThreshold: 30,
      checkInterval: 300, // 5 minutes
      irrigationDuration: 120, // 2 minutes
      updatedAt: "2026-02-28T00:00:00Z",
    },
  });
};

export const pullCommand = (req, res) => {
  res.json({
    commands: [
      {
        id: "cmd-" + Date.now(),
        deviceId: req.device.id,
        action: "irrigate",
        createdAt: new Date().toISOString(),
      },
    ],
  });
};

export const commandResult = (req, res) => {
  const { commandId } = req.params;
  const { status, result } = req.body;
  res.json({
    success: true,
    message: "Command result recorded",
    command: {
      id: commandId,
      deviceId: req.device.id,
      status: status || "completed",
      result,
      completedAt: new Date().toISOString(),
    },
  });
};
