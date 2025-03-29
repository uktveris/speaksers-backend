import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { Socket } from "socket.io";

let waitingUser: Socket | null = null;

function initSocket(server: any) {
  const io = new Server(server, {
    cors: corsSocketOptions,
  });

  io.on("connection", (socket) => {
    console.log("user connected: " + socket.id);

    socket.on("join_call", (message) => {
      console.log("user " + socket.id + " is looking for call");
      if (waitingUser && waitingUser != socket) {
        socket.emit("match_found", waitingUser.id);
        waitingUser.emit("match_found", socket.id);
        waitingUser = null;
      } else {
        waitingUser = socket;
      }
    });

    socket.on("cancel_call", () => {
      console.log("user " + socket.id + " is cancelling call");
      if (waitingUser && waitingUser.id === socket.id) {
        waitingUser = null;
        socket.emit("call_cancelled");
      }
    });

    socket.on("disconnect", () => {
      if (waitingUser === socket) {
        waitingUser = null;
      }
      console.log("user disconnected");
    });
  });
}

export default initSocket;
