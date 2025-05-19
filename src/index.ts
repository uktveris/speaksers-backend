import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { corsOptions } from "./config/options";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes";
import initSocket from "./services/socket";
import path from "path";

// dotenv.config();
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(__dirname, envFile) });

const port = process.env.PORT;

const app = express();
const server = createServer(app);

initSocket(server);

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", router);

server.listen(port, () => {
  console.log("The server is running");
});
