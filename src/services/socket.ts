import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { Socket } from "socket.io";
import { timeLog } from "console";

let waitingUser: Socket | null = null;

const timeLogger = () => {
  const d = new Date();
  return (
    "[" +
    d.getHours() +
    ":" +
    d.getMinutes() +
    ":" +
    d.getSeconds() +
    ":" +
    d.getMilliseconds() +
    "]:"
  );
};

function initSocket(server: any) {
  const io = new Server(server, {
    cors: corsSocketOptions,
  });

  io.on("connection", (socket) => {
    console.log(timeLogger() + "user connected: " + socket.id);

    socket.on("join_call", (message) => {
      console.log(timeLogger() + "user " + socket.id + " is looking for call");
      if (waitingUser && waitingUser != socket) {
        socket.emit("match_found", waitingUser.id);
        // waitingUser.emit("match_found", socket.id);
        waitingUser.emit("init_call", socket.id);
        waitingUser = null;
      } else {
        waitingUser = socket;
      }
    });

    socket.on("cancel_call", () => {
      console.log(timeLogger() + "user " + socket.id + " is cancelling call");
      if (waitingUser && waitingUser.id === socket.id) {
        waitingUser = null;
        socket.emit("call_cancelled");
      }
    });

    socket.on("offer", (data) => {
      console.log(
        timeLogger() +
          "user: " +
          socket.id +
          " is sending offer to: " +
          data.recipient,
      );
      socket
        .to(data.recipient)
        .emit("offer", { offer: data.offer, from: socket.id });
    });

    socket.on("answer", (data) => {
      console.log(
        timeLogger() +
          "user: " +
          socket.id +
          " is answering to: " +
          data.recipient,
      );
      socket
        .to(data.recipient)
        .emit("answer", { answer: data.answer, from: socket.id });
    });

    socket.on("ice-candidate", (data) => {
      console.log(
        timeLogger() + "user: " + socket.id + " is sending ICE candiate",
      );
      socket
        .to(data.recipient)
        .emit("ice-candidate", { candidate: data.candidate, from: socket.id });
    });

    socket.on("end-call", (data) => {
      console.log(
        timeLogger() +
          "user: " +
          socket.id +
          "is ending call with user " +
          data.recipient,
      );
      // waitingUser = null;
      socket.to(data.recipient).emit("end-call");
    });

    socket.on("disconnect", () => {
      if (waitingUser === socket) {
        console.log(
          timeLogger() + "user removed from call queue: " + socket.id,
        );
        waitingUser = null;
      }
      console.log(timeLogger() + "user disconnected: " + socket.id);
    });
  });
}

export default initSocket;
