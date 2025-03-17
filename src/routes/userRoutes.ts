import { Router } from "express";
import deleteUser from "../controllers/deleteUserController";

const userRoutes = Router();

userRoutes.delete("/delete", deleteUser);
// userRoutes.get("/test", (request, response) => {
//   console.log("test");
//   response.json({ msg: "some test data here!" });
// });

export default userRoutes;
