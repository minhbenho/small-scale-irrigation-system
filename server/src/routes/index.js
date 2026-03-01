import { Router } from "express";
import authRoutes from "./auth.routes.js";
import devicesRoutes from "./devices.routes.js";
import iotRoutes from "./iot.routes.js";

const router = Router();

router.use("/api/auth", authRoutes);
router.use("/api/devices", devicesRoutes);
router.use("/api/iot", iotRoutes);

export default router;