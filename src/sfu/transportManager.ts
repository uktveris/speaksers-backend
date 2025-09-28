import { AppData, Router, Worker } from "mediasoup/node/lib/types";
import { Peer, TransportRoom } from "../models/calls";

const transportRooms = new Map<string, TransportRoom>();

export const routers = new Map<string, Router<AppData>>();

export function getOrCreateTransportRoom(id: string) {
  let room = transportRooms.get(id);
  if (!room) {
    room = {
      id: id,
      peers: new Map<string, Peer>(),
    };
    transportRooms.set(id, room);
  }
  return room;
}
