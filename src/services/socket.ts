import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { logger } from "../config/logging";
import { roomHandlers } from "./handlers/roomHandlers";
import { getWorker, initializeMediasoupWorkers } from "../sfu/utils";

const context = "SOCKET";

async function initSocket(server: any) {
  const io = new Server(server, {
    cors: corsSocketOptions,
  });

  // const worker = await createMediasoupWorker();
  await initializeMediasoupWorkers();

  // TODO: add auth protection to socket on connection handler
  io.on("connection", (socket) => {
    logger.info({
      message: "user connected to main nsp",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });

    socket.on("disconnect", () => {
      logger.info({
        message: "user disconnected main nsp",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
    });
  });

  const callsNsp = io.of("/calls");
  callsNsp.on("connection", (socket) => {
    logger.info({
      message: "user connected to /calls nsp",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
    const worker = getWorker();
    roomHandlers(callsNsp, socket, worker);
  });

  const chatNsp = io.of("/chats");
  chatNsp.on("connection", (socket) => {
    logger.info({
      message: "user connected to /chats nsp",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
  });
}

export default initSocket;
