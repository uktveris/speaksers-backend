import { Router } from "express";
import deleteUser from "../controllers/deleteUserController";

const userRoutes = Router();

userRoutes.delete("/delete", deleteUser);

export default userRoutes;
