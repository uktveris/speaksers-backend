import { DefaultEventsMap, Server, Socket } from "socket.io";
import { logger } from "../../config/logging";
import {
  createRoom,
  endRoom,
  getRoom,
  getRoomSize,
  initiateTopicSetup,
  removeRoomMembers,
} from "../roomManager";
import { createTimer, deleteTimer } from "../timerManager";

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
      const duration = 1000 * 60;
      createTimer(io, socket, waitingUser, callId, duration);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("stop_timer", async (data) => {
    const room = getRoom(data.callId);
    if (!room) return;
    room.timerStopVotes.add(socket.id);
    const size = await getRoomSize(io, data.callId);
    console.log(
      "socket " + socket.id + " is voting to stop timer, timerStopvotes: ",
      room.timerStopVotes.size,
    );
    if (!size) return;
    const peer = room.participants.find((p) => p !== socket.id)!;
    io.to(peer).emit("peer_ready");
    if (size <= room.timerStopVotes.size) {
      console.log("votes treshold reached, stopping timer..");
      io.to(data.callId).emit("timer_stopped");
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

  socket.on("end-call", async (data) => {
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
    await removeRoomMembers(io, data.callId);
    deleteTimer(data.callId);
    endRoom(data.callId);
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
