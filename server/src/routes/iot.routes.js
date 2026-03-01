import { Router } from "express";
import { requireDeviceAuth } from "../middlewares/deviceAuth.js";
import * as iot from "../controllers/iot.controller.js";

const router = Router();

router.use(requireDeviceAuth);

router.post("/heartbeat", iot.heartbeat);
router.post("/irrigations", iot.pushIrrigation);
router.get("/config", iot.getConfig);
router.get("/commands", iot.pullCommand);
router.post("/commands/:commandId/result", iot.commandResult);

export default router;