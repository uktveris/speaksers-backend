import { Router } from "express";
import userRoutes from "./userRoutes";
import tokenRoutes from "./turnServerRoutes";

const router = Router();

router.use("/users", userRoutes);
router.use("/turn-servers", tokenRoutes);

router.get("/health", (req, res) => {
  res.json({ status: "backend is healthy" });
});

router.post("/logs", (req, res) => {
  console.log("received log:", { req });
  res.json({ message: "log received" });
});

export default router;
