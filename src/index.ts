import express from "express";
import { corsOptions } from "./config/options";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", router);

app.listen(port, () => {
  console.log("The server is running");
});
