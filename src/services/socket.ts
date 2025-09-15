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

  io.on("connection", (socket) => {
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });

    signalingHandlers(io, socket);
    roomHandlers(io, socket);
  });
}

export default initSocket;
