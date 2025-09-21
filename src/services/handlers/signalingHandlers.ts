import { DefaultEventsMap, Server, Socket, Namespace } from "socket.io";
import { logger } from "../../config/logging";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { AppData } from "mediasoup/node/lib/types";
import { Consumer, Producer } from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { v4 as uuidv4 } from "uuid";
import {
  createMediasoupWorker,
  mediacodecs,
  transportOptions,
} from "../../sfu/utils";
import { getOrCreateTransportRoom } from "../../sfu/transportManager";

const context = "SIGNALING";

export async function signalingHandlers(
  io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
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
