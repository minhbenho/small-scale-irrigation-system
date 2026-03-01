import { Router } from "express";
import { requireJwt } from "../middlewares/authJwt.js";
import * as devices from "../controllers/devices.controller.js";

const router = Router();

// Protected routes - require JWT
router.use(requireJwt);

router.get("/", devices.listDevices);
router.post("/", devices.addDevice);
router.patch("/:deviceId", devices.updateDevice);
router.delete("/:deviceId", devices.deleteDevice);

// Irrigations
router.get("/:deviceId/irrigations", devices.listIrrigations);

// Stats
router.get("/:deviceId/stats", devices.getStats);

// Commands
router.post("/:deviceId/commands", devices.createCommand);
router.get("/:deviceId/commands", devices.listCommands);

export default router;