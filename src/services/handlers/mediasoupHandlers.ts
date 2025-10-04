import { Socket, Namespace } from "socket.io";
import { logger } from "../../config/logging";
import { Producer } from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";
import { createMediasoupTransport } from "../../sfu/utils";
import { Peer, TransportRoom } from "../../models/calls";
import { deleteTransportRoom } from "../../sfu/transportManager";

const context = "SIGNALING";

export async function attachMediasoupHandlers(io: Namespace, socket: Socket, room: TransportRoom, peer: Peer) {
  socket.removeAllListeners("get_router_capabilities");
  socket.removeAllListeners("create_transport");
  socket.removeAllListeners("connect_transport");
  socket.removeAllListeners("transport_produce");
  socket.removeAllListeners("connect_transport_recv");
  socket.removeAllListeners("transport_consume");
  socket.removeAllListeners("consume_resume");

  const router = room.router;

  socket.on("get_router_capabilities", (callback) => {
    const capabilities = router.rtpCapabilities;
    callback(capabilities);
  });

  socket.on("create_transport", async ({ sender }, callback) => {
    console.log("create sender transport?: ", sender);
    try {
      if (sender) {
        const { transport: pt, params } = await createMediasoupTransport(router);
        console.log("creating producer transport: ", pt!.id);
        peer.transports.set(pt!.id, pt!);
        callback({ params });
      } else {
        const { transport: ct, params } = await createMediasoupTransport(router);
        console.log("creating consumer transport: ", ct!.id);
        peer.transports.set(ct!.id, ct!);
        callback({ params });
      }
    } catch (error) {
      callback({ params: { error: error } });
    }
  });

  socket.on("connect_transport", async ({ transportId, dtlsParameters }) => {
    console.log("dtls params: ", { dtlsParameters });
    const transport = peer.transports.get(transportId);
    if (!transport) {
      console.log("connect_transport: transport not found with id: ", transportId);
      return;
    }
    await transport.connect({ dtlsParameters });
  });

  socket.on("transport_produce", async ({ transportId, kind, rtpParameters }, callBack) => {
    const transport = peer.transports.get(transportId);
    if (!transport) {
      console.log("trying produce from undefined producer transport");
      callBack({ params: { error: "no producer transport" } });
      return;
    }
    const producer = await transport.produce({
      kind: kind,
      rtpParameters: rtpParameters,
    });
    peer.producers.set(producer.id, producer);
    console.log("transport_produce: producer id: ", producer.id);

    producer.on("transportclose", () => {
      console.log("transport for this producer closed");
      producer.close();
    });
    producer.on("@close", () => {
      console.log("closed producer id: ", producer.id);
      peer.producers.delete(producer.id);
    });

    callBack({
      id: producer.id,
    });
    for (let [otherId, otherPeer] of room.peers.entries()) {
      if (otherId === socket.id) continue;
      console.log("emitting new producer to peer:", otherId);
      // io.
      socket.to(otherId).emit("new_producer", {
        producerId: producer.id,
        producerPeerId: peer.id,
        kind: producer.kind,
      });
    }
  });

  socket.on("connect_transport_recv", async ({ transportId, dtlsParameters }) => {
    const transport = peer.transports.get(transportId);
    if (!transport) {
      console.log("trying connect to undefined producer transport");
      return;
    }
    console.log("dtls params recv: ", { dtlsParameters });
    await transport.connect({ dtlsParameters });
  });

  socket.on("transport_consume", async ({ transportId, rtpCapabilities, producerId }, callback) => {
    const transport = peer.transports.get(transportId);
    if (!transport) {
      return callback({ params: { error: "no transport" } });
    }
    let producerToConsume: Producer | undefined;
    for (let [otherId, otherPeer] of room.peers.entries()) {
      console.log("otherpeer (", otherPeer.id, ") producers:", otherPeer.producers);
      if (otherId === socket.id) continue;
      // const pr = otherPeer.producers.get(producerId);
      const pr = otherPeer.producers.values().next().value;
      if (pr) {
        producerToConsume = pr;
        break;
      }
    }
    if (!producerToConsume) {
      console.log("transport_consume: no producerToConsume, returning");
      callback({ error: "no producer to consume" });
      return;
    }

    try {
      if (
        !router.canConsume({
          producerId: producerToConsume.id,
          rtpCapabilities: rtpCapabilities,
        })
      ) {
        console.log("cannot consume");
        callback({ params: { error: "cannot consume" } });
        return;
      }
      const consumer = await transport.consume({
        producerId: producerToConsume.id,
        rtpCapabilities: rtpCapabilities,
        paused: true,
      });

      peer.consumers.set(consumer.id, consumer);
      console.log("transport_consume: created consumer: ", consumer.id);

      consumer.on("transportclose", () => {
        console.log("consumer transport closed");
      });

      consumer.on("producerclose", () => {
        consumer.close();
        peer.consumers.delete(consumer.id);
        console.log("producer closed: ", producerToConsume.id);
      });

      const params = {
        id: consumer.id,
        producerId: producerToConsume.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      };
      callback(params);
    } catch (error) {
      console.log("error consuming: ", { error });
      callback({
        params: {
          error: error,
        },
      });
    }
  });

  socket.on("get_producers", (callback) => {
    const producers: { producerId: string; producerPeerId: string; kind: string }[] = [];
    for (let [otherId, otherPeer] of room.peers.entries()) {
      if (otherId === socket.id) continue;
      for (let producer of otherPeer.producers.values()) {
        producers.push({ producerId: producer.id, producerPeerId: otherId, kind: producer.kind });
      }
    }
    callback(producers);
  });

  socket.on("consume_resume", async ({ consumerId }) => {
    const consumer = peer.consumers.get(consumerId);
    if (!consumer) {
      console.log("consume_resume: no consumer found");
      return;
    }
    await consumer.resume();
    console.log("consumer resume");
  });

  socket.on("disconnect", async () => {
    console.log("socket disconnected: cleaning up----------------", peer.id);
    console.log("peer producers:", peer.producers.keys());
    console.log("peer consumers:", peer.consumers.keys());
    console.log("peer transports:", peer.transports.keys());
    for (let producer of peer.producers.values()) {
      producer.close();
    }
    for (let consumer of peer.consumers.values()) {
      consumer.close();
    }
    for (let transport of peer.transports.values()) {
      transport.close();
    }

    peer.producers.clear();
    peer.consumers.clear();
    peer.transports.clear();
    room.peers.delete(socket.id);
    room.router.close();
    deleteTransportRoom(room.id);

    logger.info({
      message: "user disconnected",
      context: context,
      meta: {
        additionalInfo: { senderSocketId: socket.id },
      },
    });
  });
}
