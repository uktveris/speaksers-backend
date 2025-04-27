import { Router } from "express";
import deleteUser from "../controllers/users/deleteUserController";
import { authMiddleware } from "../middleware/auth";
import checkUser from "../controllers/users/checkController";

const userRoutes = Router();

userRoutes.delete("/delete", authMiddleware, deleteUser);
userRoutes.get("/user", authMiddleware, checkUser);

export default userRoutes;
