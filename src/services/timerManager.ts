import { DefaultEventsMap, Namespace, Socket } from "socket.io";

const timers = new Map<string, number>();

export function createTimer(
  io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket1: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  socket2: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  callId: string,
  durationMs: number,
): number {
  const endTime = Date.now() + durationMs;
  timers.set(callId, endTime);
  console.log("endtime for call: " + callId + ": ", { endTime });
  io.to(callId).emit("timer_started", { endTime: endTime });
  return endTime;
}

export function deleteTimer(callId: string) {
  if (!timers.get(callId)) {
    console.log("trying to delete nonexistent timer: ", { callId });
  }
  timers.delete(callId);
  console.log("deleted timer: ", { callId });
}
