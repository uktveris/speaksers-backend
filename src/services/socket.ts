import { Server } from "socket.io";
import { corsOptions } from "../config/options";
import { Socket } from "socket.io";

let waitingUser: Socket | null = null;

function initSocket(server: any) {
  const io = new Server(server, {
    // cors: corsOptions,
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("join_call", (message) => {
      if (waitingUser) {
        socket.emit("match_found", waitingUser.id);
        waitingUser.emit("match_found", socket.id);
        waitingUser = null;
      } else {
        waitingUser = socket;
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
