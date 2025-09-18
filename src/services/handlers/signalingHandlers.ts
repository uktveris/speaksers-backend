import { DefaultEventsMap, Server, Socket } from "socket.io";
import { logger } from "../../config/logging";

const context = "SIGNALING";

export function signalingHandlers(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) {
  socket.on("offer", (data) => {
    // logger.info({
    //   message: "offer sent",
    //   context: context,
    //   meta: {
    //     additionalInfo: {
    //       initiatingSocketId: socket.id,
    //       receivingSocketId: data.recipient,
    //     },
    //   },
    // });
    socket
      .to(data.recipient)
      .emit("offer", { offer: data.offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    // logger.info({
    //   message: "answer sent",
    //   context: context,
    //   meta: {
    //     additionalInfo: {
    //       initiatingSocketId: socket.id,
    //       receivingSocketId: data.recipient,
    //     },
    //   },
    // });
    socket
      .to(data.recipient)
      .emit("answer", { answer: data.answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    // logger.info({
    //   message: "ice candidate sent",
    //   context: context,
    //   meta: {
    //     additionalInfo: { senderSocketId: socket.id },
    //   },
    // });
    socket
      .to(data.recipient)
      .emit("ice-candidate", { candidate: data.candidate, from: socket.id });
  });
}
