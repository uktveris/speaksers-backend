import { Server } from "socket.io";
import { corsSocketOptions } from "../config/options";
import { Socket } from "socket.io";
import { timeLog } from "console";
import { logger } from "../config/logging";

const context = "SOCKET";

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
    // console.log(timeLogger() + "user connected: " + socket.id);
    logger.info({
      message: "user connected",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });

    socket.on("join_call", (message) => {
      // console.log(timeLogger() + "user " + socket.id + " is looking for call");
      logger.info({
        message: "initiated call search",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
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
      // console.log(timeLogger() + "user " + socket.id + " is cancelling call");
      logger.info({
        message: "cancelled call search",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
      if (waitingUser && waitingUser.id === socket.id) {
        waitingUser = null;
        socket.emit("call_cancelled");
      }
    });

    socket.on("offer", (data) => {
      logger.info({
        message: "offer sent",
        context: context,
        meta: {
          additionalInfo: {
            initiatingSocketId: socket.id,
            receivingSocketId: data.recipient,
          },
        },
      });
      // console.log(
      //   timeLogger() +
      //     "user: " +
      //     socket.id +
      //     " is sending offer to: " +
      //     data.recipient,
      // );
      socket
        .to(data.recipient)
        .emit("offer", { offer: data.offer, from: socket.id });
    });

    socket.on("answer", (data) => {
      logger.info({
        message: "answer sent",
        context: context,
        meta: {
          additionalInfo: {
            initiatingSocketId: socket.id,
            receivingSocketId: data.recipient,
          },
        },
      });
      // console.log(
      //   timeLogger() +
      //     "user: " +
      //     socket.id +
      //     " is answering to: " +
      //     data.recipient,
      // );
      socket
        .to(data.recipient)
        .emit("answer", { answer: data.answer, from: socket.id });
    });

    socket.on("ice-candidate", (data) => {
      logger.info({
        message: "ice candidate sent",
        context: context,
        meta: {
          additionalInfo: { senderSocketId: socket.id },
        },
      });
      // console.log(
      //   timeLogger() + "user: " + socket.id + " is sending ICE candiate",
      // );
      socket
        .to(data.recipient)
        .emit("ice-candidate", { candidate: data.candidate, from: socket.id });
    });

    socket.on("end-call", (data) => {
      logger.info({
        message: "call ended",
        context: context,
        meta: {
          additionalInfo: {
            initiatingSocketId: socket.id,
            receivingSocketId: data.recipient,
          },
        },
      });
      // console.log(
      //   timeLogger() +
      //     "user: " +
      //     socket.id +
      //     "is ending call with user " +
      //     data.recipient,
      // );
      // waitingUser = null;
      socket.to(data.recipient).emit("end-call");
    });

    socket.on("disconnect", () => {
      if (waitingUser === socket) {
        logger.info({
          message: "user removed from call queue",
          context: context,
          meta: {
            additionalInfo: { socketId: socket.id },
          },
        });
        // console.log(
        //   timeLogger() + "user removed from call queue: " + socket.id,
        // );
        waitingUser = null;
      }
      logger.info({
        message: "user disconnected",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
      // console.log(timeLogger() + "user disconnected: " + socket.id);
    });
  });
}

export default initSocket;
