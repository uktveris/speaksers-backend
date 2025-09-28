import { DefaultEventsMap, Server, Socket, Namespace } from "socket.io";
import { logger } from "../../config/logging";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { AppData, Worker } from "mediasoup/node/lib/types";
import { Consumer, Producer } from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { v4 as uuidv4 } from "uuid";
import {
  createMediasoupRouter,
  createMediasoupTransport,
  createMediasoupWorker,
} from "../../sfu/utils";
import { getOrCreateTransportRoom } from "../../sfu/transportManager";

const context = "SIGNALING";

export async function signalingHandlers(
  io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  worker: Worker<AppData>,
) {
  const router = await createMediasoupRouter(worker);
  const id = uuidv4();

  const room = getOrCreateTransportRoom(id);
  room.router = router;
  const peer = {
    id: socket.id,
    transports: new Map<string, WebRtcTransport>(),
    producers: new Map<string, Producer>(),
    consumers: new Map<string, Consumer>(),
  };
  room.peers.set(peer.id, peer);

  let producerTransport: WebRtcTransport<AppData> | undefined = undefined;
  let consumerTransport: WebRtcTransport<AppData> | undefined = undefined;
  let producer: Producer<AppData> | undefined = undefined;
  let consumer: Consumer<AppData> | undefined = undefined;

  socket.on("offer", (data) => {
    socket
      .to(data.recipient)
      .emit("offer", { offer: data.offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    socket
      .to(data.recipient)
      .emit("answer", { answer: data.answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    socket
      .to(data.recipient)
      .emit("ice-candidate", { candidate: data.candidate, from: socket.id });
  });

  socket.on("get_router_capabilities", (callback) => {
    const capabilities = router.rtpCapabilities;
    callback(capabilities);
  });

  socket.on("create_transport", async ({ sender }, callback) => {
    console.log("create sender transport?: ", sender);
    if (sender) {
      producerTransport = await createMediasoupTransport(router, callback);
    } else {
      consumerTransport = await createMediasoupTransport(router, callback);
    }
  });

  // TODO: include transport id in request for better transport management
  socket.on("connect_transport", async ({ dtlsParameters }) => {
    if (!producerTransport) {
      console.log("trying connect to undefined producer transport");
      return;
    }
    console.log("dtls params: ", { dtlsParameters });
    await producerTransport.connect({ dtlsParameters });
  });

  // TODO: include transport id in request for better transport management
  socket.on(
    "transport_produce",
    async ({ kind, rtpParameters, appData }, callBack) => {
      if (!producerTransport) {
        console.log("trying produce from undefined producer transport");
        callBack({ params: { error: "no producer transport" } });
        return;
      }
      producer = await producerTransport.produce({
        kind: kind,
        rtpParameters: rtpParameters,
      });

      console.log("producer id: ", producer.id);

      producer.on("transportclose", () => {
        console.log("transport for this producer closed");
        producer!.close();
      });

      callBack({
        id: producer.id,
      });
    },
  );

  socket.on("connect_transport_recv", async ({ dtlsParameters }) => {
    if (!consumerTransport) {
      console.log("trying connect to undefined producer transport");
      return;
    }
    console.log("dtls params recv: ", { dtlsParameters });
    await consumerTransport.connect({ dtlsParameters });
  });

  socket.on("transport_consume", async ({ rtpCapabilities }, callBack) => {
    if (!producer) {
      console.log("transport_consume: no producer, returning");
      return;
    }
    if (!consumerTransport) {
      console.log("transport_consume: no consumerTransport, returning");
      return;
    }
    try {
      if (
        !router.canConsume({
          producerId: producer.id,
          rtpCapabilities: rtpCapabilities,
        })
      ) {
        console.log("cannot consume");
        return;
      }
      consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities: rtpCapabilities,
        paused: true,
      });

      console.log("transport_consume: created consumer: ", consumer.id);

      consumer.on("transportclose", () => {
        console.log("consumer transport closed");
      });

      consumer.on("producerclose", () => {
        console.log("producer of consumer closed");
      });

      const params = {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };
      callBack(params);
    } catch (error) {
      console.log("error consuming: ", { error });
      callBack({
        params: {
          error: error,
        },
      });
    }
  });

  socket.on("consume_resume", async () => {
    if (!consumer) {
      console.log("consume_resume: no consumer found");
      return;
    }
    console.log("consumer resume");
    await consumer?.resume();
  });

  socket.on("disconnect", async () => {
    for (let producer of peer.producers.values()) {
      await producer.close();
    }
    for (let consumer of peer.consumers.values()) {
      await consumer.close();
    }
    for (let transport of peer.transports.values()) {
      transport.close();
    }

    room.peers.delete(peer.id);
    // if (room.peers.size == 0) {
    //   await room.router?.close();
    //   deleteTransportRoom(room.id);
    // }
    logger.info({
      message: "user disconnected",
      context: context,
      meta: {
        additionalInfo: { senderSocketId: socket.id },
      },
    });
  });
}
