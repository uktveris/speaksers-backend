import { Router } from "express";
import userRoutes from "./userRoutes";
import tokenRoutes from "./turnServerRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/turn-servers", tokenRoutes);

export default router;
