import { Consumer } from "mediasoup/node/lib/ConsumerTypes";
import { PlainTransport } from "mediasoup/node/lib/PlainTransportTypes";
import { spawn, ChildProcess } from "child_process";
import { Producer } from "mediasoup/node/lib/ProducerTypes";
import { Router } from "mediasoup/node/lib/RouterTypes";
import path from "path";
import * as fs from "fs/promises";
import { plainTransportOptions } from "./utils";
import * as dgram from "dgram";

export const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

interface RecordingData {
  recordConsumer: Consumer;
  recordTransport: PlainTransport;
  ffmpegProcess: ChildProcess;
  filePath: string;
  stopped: boolean;
}

interface RecordingSession {
  roomId: string;
  speakers: Map<string, RecordingData>;
  startTime: Date;
}

export const activeRecordings = new Map<string, RecordingSession>();

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = dgram.createSocket("udp4");
    server.bind(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

export async function startRecordingProducer(
  producer: Producer,
  peerId: string,
  roomId: string,
  router: Router,
): Promise<RecordingData> {
  const timestamp = Date.now();
  const fileName = `${roomId}_${peerId}_${timestamp}.wav`;
  const filePath = path.join(RECORDINGS_DIR, fileName);
  const sdpFileName = `${roomId}_${peerId}_${timestamp}.sdp`;
  const sdpFilePath = path.join(RECORDINGS_DIR, sdpFileName);

  await fs.mkdir(RECORDINGS_DIR, { recursive: true });

  const ffmpegPort = await getAvailablePort();
  console.log("ffmpeg is listening on port:", ffmpegPort);

  const recordTransport = await router.createPlainTransport(plainTransportOptions);
  console.log("created recording transport for peer:", peerId);
  console.log("transport tuple:", recordTransport);
  console.log("created recording transport for peer:", peerId);

  const recordConsumer = await recordTransport.consume({
    producerId: producer.id,
    rtpCapabilities: router.rtpCapabilities,
    paused: false,
  });

  const rtpParameters = recordConsumer.rtpParameters;
  const codec = rtpParameters.codecs[0];
  const payloadType = codec.payloadType;
  console.log("full RTP Parameters:", JSON.stringify(rtpParameters, null, 2));

  const sdp = [
    "v=0",
    "o=- 0 0 IN IP4 127.0.0.1",
    "s=Mediasoup Recording",
    "c=IN IP4 127.0.0.1",
    "t=0 0",
    `m=audio ${ffmpegPort} RTP/AVP ${payloadType}`,
    `a=rtpmap:${payloadType} opus/${codec.clockRate}/${codec.channels}`,
    `a=fmtp:${payloadType} minptime=10;useinbandfec=1`,
    "a=recvonly",
    "",
  ].join("\n");

  await fs.writeFile(sdpFilePath, sdp);
  console.log("created sdp file:", sdpFilePath);

  const ffmpegArgs = [
    "-protocol_whitelist",
    "file,rtp,udp",
    "-analyzeduration",
    "10M",
    "-i",
    sdpFilePath,
    "-map",
    "0:a:0",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "48000",
    "-ac",
    "1",
    "-y",
    filePath,
  ];

  const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`FFmpeg [${peerId}]: ${data.toString()}`);
  });

  ffmpegProcess.on("error", (error) => {
    console.log(`FFmpeg error for peer ${peerId}: ${error}`);
  });

  ffmpegProcess.on("close", async (code) => {
    console.log(`FFmpeg process for peer ${peerId} closed with code ${code}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await recordTransport.connect({
    ip: "127.0.0.1",
    port: ffmpegPort,
    rtcpPort: ffmpegPort + 1,
  });

  console.log(`started recording for peer ${peerId} to ${filePath}`);
  console.log(`mediasoup sending rtp to 127.0.0.1:${ffmpegPort}`);

  return { recordConsumer, recordTransport, ffmpegProcess, filePath, stopped: false };
}

export async function stopRecording(recordingData: RecordingData): Promise<string> {
  return new Promise((resolve, reject) => {
    const { recordConsumer, recordTransport, ffmpegProcess, filePath } = recordingData;

    if (recordingData.stopped) {
      resolve(filePath);
    }
    const sdpFilePath = filePath.replace(".wav", ".sdp");

    let resolved = false;

    const cleanup = async () => {
      if (resolved) return;
      resolved = true;
      recordingData.stopped = true;

      try {
        recordConsumer.close();
        recordTransport.close();
        await fs.unlink(sdpFilePath);
        console.log("cleaned up sdp files");
        console.log("recording stopped");
      } catch (error) {
        console.log("error while closing mediasoup resources:", error);
      }
    };

    const timeout = setTimeout(async () => {
      console.log("FFmpeg did not close gracefully, killing process");
      try {
        ffmpegProcess.kill("SIGKILL");
      } catch (error) {
        console.log("error killing ffmpeg:", error);
      }

      await cleanup();
      reject(new Error("FFmpeg timeout"));
    }, 5000);

    ffmpegProcess.on("close", async (code) => {
      clearTimeout(timeout);
      await cleanup();
      resolve(filePath);
    });

    try {
      const stdin = ffmpegProcess.stdin;
      if (stdin && !stdin.destroyed && stdin.writable) {
        stdin.write("q\n", (error) => {
          if (error) {
            console.log("error while writing to ffmpeg stdin:", error);
          }
          try {
            stdin.end();
            console.log("closed ffmpeg stdin");
          } catch (error) {}
        });
      } else {
        console.log("ffmpeg stdin not writable, sendin SIGTERM");
        ffmpegProcess.kill();
      }
    } catch (error) {
      console.log("error stopping FFmpeg:", error);
      ffmpegProcess.kill("SIGKILL");
    }
  });
}

export function startRecordingSession(roomId: string) {
  if (activeRecordings.has(roomId)) {
    console.log("skipping adding room recording; recording already exists for room:", roomId);
    return;
  }

  const session: RecordingSession = {
    roomId,
    speakers: new Map(),
    startTime: new Date(),
  };

  activeRecordings.set(roomId, session);
  console.log("started recording session for roomId:", roomId);
  console.log("current active recordings:", { activeRecordings });
}

export async function stopRecordingSession(roomId: string): Promise<string[]> {
  const session = activeRecordings.get(roomId);
  if (!session) {
    console.log("cannot stop recording session; no session with roomId:", roomId);
    return [];
  }

  const filePaths: string[] = [];
  for (const [peerId, recordingData] of session.speakers.entries()) {
    try {
      console.log("stopping recording for peer:", peerId);
      const filePath = await stopRecording(recordingData);
      filePaths.push(filePath);
    } catch (error) {
      console.log(`error while stopping recording for peer: ${peerId}: ${error}`);
    }
  }
  activeRecordings.delete(roomId);
  console.log("stopped recording session for room with id:", roomId);
  return filePaths;
}
