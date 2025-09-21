import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { Socket } from "socket.io";
import { logger } from "../config/logging";
import { signalingHandlers } from "./handlers/signalingHandlers";
import { roomHandlers } from "./handlers/roomHandlers";

const context = "SOCKET";

function initSocket(server: any) {
  const io = new Server(server, {
    cors: corsSocketOptions,
  });

  // TODO: add auth protection to socket on connection handler
  io.on("connection", (socket) => {
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
  });

  const callsNsp = io.of("/calls");
  callsNsp.on("connection", async (socket) => {
    console.log("new user connected to calls nsp: ", socket.id);

    await signalingHandlers(callsNsp, socket);
    roomHandlers(callsNsp, socket);
  });

  const chatNsp = io.of("/chats");
  chatNsp.on("connection", (socket) => {
    console.log("new user connected to chat nsp: ", socket.id);
  });
}

export default initSocket;
