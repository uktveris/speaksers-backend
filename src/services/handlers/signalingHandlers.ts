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
  const worker = await createMediasoupWorker();
  const router = await worker.createRouter({ mediaCodecs: mediacodecs });

  const id = uuidv4();
  const room = getOrCreateTransportRoom(id);
  const peer = {
    id: socket.id,
    transports: new Map<string, WebRtcTransport>(),
    producers: new Map<string, Producer>(),
    consumers: new Map<string, Consumer>(),
  };
  room.peers.set(peer.id, peer);

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

  socket.on("get_router_capabilities", (callBack) => {
    callBack(router.rtpCapabilities);
    console.log("initiated router capabilities");
  });

  socket.on("create_transport", async (callBack) => {
    const transport = await router.createWebRtcTransport(transportOptions);

    peer.transports.set(transport.id, transport);

    callBack({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });
    console.log("creating transport for sender");
  });

  socket.on(
    "connect_transport",
    async ({ transportId, dtlsParameters }, callBack) => {
      const transport = peer.transports.get(transportId);
      if (!transport) return callBack({ message: "no transport available" });
      await transport.connect({ dtlsParameters });
      console.log("set up producer to send media");
      callBack({ message: "transport connected successfully" });
    },
  );

  socket.on(
    "transport_produce",
    async ({ transportId, kind, rtpParameters }, callBack) => {
      const transport = peer.transports.get(transportId);
      const producer = await transport!.produce({ kind, rtpParameters });
      peer.producers.set(producer?.id, producer);

      socket
        .to(room.id)
        .emit("new_producer", { producerId: producer.id, peerId: peer.id });

      callBack({ producerId: producer.id });
      console.log("produce media");
    },
  );

  // socket.on(
  //   "transport_consume",
  //   ({ producerId, rtpCapabilities }, callBack) => {
  //     const producerPeer;
  //     console.log("set up consmer for receiving media");
  //   },
  // );
}
