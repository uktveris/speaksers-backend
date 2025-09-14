import { DefaultEventsMap, Server, Socket } from "socket.io";
import { logger } from "../../config/logging";
import { createRoom, endRoom, initiateTopicSetup } from "../roomManager";

const context = "ROOM_HANDLERS";

let waitingUser: Socket | null = null;

export function roomHandlers(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) {
  socket.on("join_call", () => {
    logger.info({
      message: "initiated call search",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
    if (waitingUser && waitingUser != socket) {
      socket.emit("match_found", waitingUser.id);
      waitingUser.emit("init_call", socket.id);
      const callId = createRoom(io, socket, waitingUser);
      initiateTopicSetup(io, callId, socket, waitingUser);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("cancel_call", () => {
    logger.info({
      message: "cancelled call search",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
      socket.emit("call_cancelled");
    }
  });

  socket.on("end-call", (data) => {
    logger.info({
      message: "call ended",
      context: context,
      meta: {
        additionalInfo: {
          initiatingSocketId: socket.id,
          receivingSocketId: data.recipient,
        },
      },
    });
    socket.to(data.recipient).emit("end-call");
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket) {
      logger.info({
        message: "user removed from call queue",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
      waitingUser = null;
    }
    logger.info({
      message: "user disconnected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
  });
}
