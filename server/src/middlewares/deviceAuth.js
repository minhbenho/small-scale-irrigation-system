export function requireDeviceAuth(req, res, next) {
  // Mock device for testing
  req.device = {
    id: "device-mock-001",
    deviceSecret: "secret-abc123",
    name: "Mock Device",
  };
  next();
}