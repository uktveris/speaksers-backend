import { Worker } from "mediasoup/node/lib/types";
import { Peer, TransportRoom } from "../models/calls";
import { Namespace, Socket } from "socket.io";
import { createMediasoupRouter } from "./utils";
import { attachMediasoupHandlers } from "../services/handlers/mediasoupHandlers";

export const transportRooms = new Map<string, TransportRoom>();

export function deleteTransportRoom(id: string) {
  if (!transportRooms.has(id)) {
    console.log("trying to delete nonexistent transport room:", id);
    return;
  }
  transportRooms.delete(id);
}

export function cleanTransportRoom(id: string) {
  console.log("DEBUG: before cleaning: transportRooms:", [...transportRooms]);
  const room = transportRooms.get(id);
  if (!room) {
    console.log("cannot clean transport room, nonexistent:", id);
    return;
  }
  console.log("cleaning transport room:", room.id);
  console.log("room peers:", [...room.peers.keys()]);

  for (let peer of room.peers.values()) {
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
    console.log("after deleting: peer producers:", peer.producers.keys());
    console.log("after deleting: peer consumers:", peer.consumers.keys());
    console.log("after deleting: peer peer transport:", peer.transports.keys());
    room.peers.delete(peer.id);
  }
  room.peers.clear();
  room.router.close();
  console.log("room about to be deleted:", { room });
  transportRooms.delete(id);
  console.log("DEBUG: after cleaning: transportRooms:", [...transportRooms]);
}

export async function getOrCreateTransportRoom(id: string, worker: Worker) {
  console.log("getting room with id:", id);
  let room = transportRooms.get(id);
  if (!room) {
    console.log("no room found, creating new one");
    const router = await createMediasoupRouter(worker);
    room = {
      id: id,
      peers: new Map<string, Peer>(),
      router: router,
    };
    console.log("adding room to map");
    transportRooms.set(id, room);
    console.log("map size after adding:", transportRooms.size);
  }
  return room;
}

export async function joinTransportRoom(
  callsNsp: Namespace,
  socket1: Socket,
  socket2: Socket,
  worker: Worker,
  roomId: string,
) {
  const room = await getOrCreateTransportRoom(roomId, worker);
  const peer1: Peer = {
    id: socket1.id,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
    joined: true,
  };
  const peer2: Peer = {
    id: socket2.id,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
    joined: true,
  };
  room.peers.set(socket1.id, peer1);
  room.peers.set(socket2.id, peer2);
  console.log("users", peer1.id, peer2.id, "-> transport room:", room.id, ", peers:", room.peers.size);
  console.log("DEBUG: join: transportRooms:", [...transportRooms]);
  attachMediasoupHandlers(callsNsp, socket1, room, peer1);
  attachMediasoupHandlers(callsNsp, socket2, room, peer2);
}
