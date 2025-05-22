import { Router } from "express";
import deleteUser from "../controllers/users/deleteUserController";
import { authMiddleware } from "../middleware/auth";

const userRoutes = Router();

userRoutes.delete("/delete", authMiddleware, deleteUser);

export default userRoutes;
