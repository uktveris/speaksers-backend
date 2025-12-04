import { Namespace, Socket } from "socket.io";
import { logger } from "../../config/logging";
import { createRoom, endRoom, getRoom, getRoomSize, initiateTopicSetup, removeRoomMembers } from "../roomManager";
import { createTimer, deleteTimer } from "../timerManager";
import { cleanTransportRoom, joinTransportRoom } from "../../sfu/transportManager";
import { Worker, AppData } from "mediasoup/node/lib/types";
import { activeRecordings, startRecordingSession, stopRecording, stopRecordingSession } from "../../sfu/callRecorder";
import { transcribedCalls, transcribeDialog } from "../transcription/transcriptionService";

const context = "ROOM_HANDLERS";

let waitingUser: Socket | null = null;

export function roomHandlers(io: Namespace, socket: Socket, worker: Worker<AppData>) {
  let callStarted = false;
  socket.on("join_call", () => {
    logger.info({
      message: "initiated call search",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
    if (waitingUser && waitingUser != socket) {
      socket.emit("match_found", waitingUser.id);
      waitingUser.emit("init_call", socket.id);

      const callId = createRoom(io, socket, waitingUser);
      initiateTopicSetup(io, callId, socket, waitingUser);
      const duration = 1000 * 60;
      createTimer(io, callId, duration);

      startRecordingSession(callId);
      joinTransportRoom(io, socket, waitingUser, worker, callId);
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("stop_timer", async (data) => {
    const room = getRoom(data.callId);
    if (!room) return;
    room.timerStopVotes.add(socket.id);
    const size = await getRoomSize(io, data.callId);
    console.log("socket " + socket.id + " is voting to stop timer, timerStopvotes: ", room.timerStopVotes.size);
    if (!size) return;
    const peer = room.participants.find((p) => p !== socket.id)!;
    io.to(peer).emit("peer_ready");
    if (size <= room.timerStopVotes.size) {
      console.log("votes treshold reached, stopping timer..");
      io.to(room.id).emit("timer_stopped");
      io.to(room.id).emit("start_call");
    }
  });

  socket.on("timer_ended", ({ callId }) => {
    if (callStarted) return;
    callStarted = true;
    console.log("timer_ended: callid:", callId);
    console.log("timer_ended received, emmiting start_call");
    const room = getRoom(callId);
    if (!room) return;
    io.to(room.id).emit("start_call");
  });

  socket.on("cancel_call", () => {
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

  socket.on("end_call", async (data) => {
    logger.info({
      message: "end call executed",
      context: context,
      meta: {
        additionalInfo: {
          initiatingSocketId: socket.id,
          receivingSocketId: data.recipient,
        },
      },
    });
    console.log(`socket [${socket.id}] received 'end_call' event, received data: ${JSON.stringify(data, null, 2)}`);
    socket.to(data.recipient).emit("end_call");

    if (transcribedCalls.has(data.callId)) {
      console.log("skipping transcription; already initiated for call:", data.callId);
      return;
    }
    transcribedCalls.add(data.callId);
    const recordingSession = activeRecordings.get(data.callId);

    await stopRecordingSession(data.callId);
    await removeRoomMembers(io, data.callId);
    deleteTimer(data.callId);
    endRoom(data.callId);
    cleanTransportRoom(data.callId);

    if (!recordingSession) {
      console.log("no recording session found for call:", data.callId);
      transcribedCalls.delete(data.callId);
      return;
    }
    const speakers = Array.from(recordingSession.speakers.entries());
    if (speakers.length !== 2) {
      console.log("error occurred, expected 2 speakers, found:", speakers.length);
      transcribedCalls.delete(data.callId);
      return;
    }
    const [speaker1, speaker2] = speakers;
    const audioPath1 = speaker1[1].filePath;
    const audioPath2 = speaker2[1].filePath;
    if (!audioPath1 || !audioPath2) {
      console.log("missing audio paths for transcription");
      transcribedCalls.delete(data.callId);
      return;
    }
    console.log("starting transcription for room:", data.callId);
    const { result, error } = await transcribeDialog(speaker1[0], audioPath1, speaker2[0], audioPath2);
    console.log("finished transcription for socket:", socket.id);
    if (error) {
      console.log("error occurred while transcribing:", error);
      return;
    }
    console.log("transcription:", result?.text);
    transcribedCalls.delete(data.callId);
  });

  socket.on("disconnect", async () => {
    if (waitingUser === socket) {
      logger.info({
        message: "user removed from call queue",
        context: context,
        meta: {
          additionalInfo: { socketId: socket.id },
        },
      });
      waitingUser = null;
    }
    logger.info({
      message: "user disconnected /calls nsp",
      context: context,
      meta: {
        additionalInfo: { socketId: socket.id },
      },
    });
  });
}
