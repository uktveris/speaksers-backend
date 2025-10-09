import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import getTurnServer from "../controllers/turnServers/getTurnServerController";

const turnServerRoutes = Router();

turnServerRoutes.get("/get-turn-server", authMiddleware, getTurnServer);

export default turnServerRoutes;
