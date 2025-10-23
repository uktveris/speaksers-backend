import dotenv from "dotenv";
import path from "path";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import express from "express";
import { createServer } from "http";
import { corsOptions } from "./config/options";
import cors from "cors";
import router from "./routes";
import initSocket from "./services/socket";

const port = process.env.PORT;

const app = express();
const server = createServer(app);

initSocket(server);

app.set("trust-proxy", 1);
app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", router);

server.listen(port, () => {
  console.log("The server is running on port:", port);
});
