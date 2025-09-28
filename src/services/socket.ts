import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { Socket } from "socket.io";
import { logger } from "../config/logging";
import { signalingHandlers } from "./handlers/signalingHandlers";
import { roomHandlers } from "./handlers/roomHandlers";
import { createMediasoupWorker } from "../sfu/utils";

const context = "SOCKET";

const worker = createMediasoupWorker();

function initSocket(server: any) {
  const io = new Server(server, {
    cors: corsSocketOptions,
  });

  // TODO: add auth protection to socket on connection handler
  io.on("connection", async (socket) => {
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });

    socket.on("disconnect", () => {
      logger.info({
        message: "user disconnected",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
    });
  });

  const callsNsp = io.of("/calls");
  callsNsp.on("connection", async (socket) => {
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });

    await signalingHandlers(callsNsp, socket, await worker);
    roomHandlers(callsNsp, socket);
  });

  const chatNsp = io.of("/chats");
  chatNsp.on("connection", (socket) => {
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
  });
}

export default initSocket;
