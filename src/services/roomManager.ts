import { DefaultEventsMap, Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { getRandomTopic, getRoles } from "./callMechanics";

export interface CallRoom {
  id: string;
  participants: string[];
  roles: string[];
  createdAt: number;
}

const callRooms = new Map<string, CallRoom>();

export function getRoom(callId: string): CallRoom | null {
  if (!callRooms.get(callId)) {
    console.log("no room with id: ", callId);
    return null;
  }
  return callRooms.get(callId)!;
}

export function createRoom(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket1: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket2: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) {
  const callId = uuidv4();
  const [role1, role2] = getRoles();

  callRooms.set(callId, {
    id: callId,
    participants: [socket1.id, socket2.id],
    roles: [role1, role2],
    createdAt: Date.now(),
  });

  socket1.join(callId);
  console.log("user: " + socket1.id + " -> " + callId);
  socket2.join(callId);
  console.log("user: " + socket2.id + " -> " + callId);
  return callId;
}

export function initiateTopicSetup(
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  callId: string,
  socket1: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket2: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) {
  const roles = getRoles();
  const topic = getRandomTopic();
  io.to(socket1.id).emit("topic_sent", {
    callId: callId,
    role: roles[0],
    topic: topic,
  });
  io.to(socket2.id).emit("topic_sent", {
    callId: callId,
    role: roles[1],
    topic: topic,
  });
}

export function endRoom(callId: string) {
  if (!callRooms.get(callId)) {
    console.log("trying to delete unexisting room: ", { callId });
    return;
  }
  callRooms.delete(callId);
}
