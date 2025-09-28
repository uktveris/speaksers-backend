import { createWorker } from "mediasoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { RouterRtpCodecCapability } from "mediasoup/node/lib/rtpParametersTypes";
import { AppData, WebRtcTransportOptions } from "mediasoup/node/lib/types";
import { Worker } from "mediasoup/node/lib/types";

export const mediacodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

// const testIp = "127.0.0.1";
const testIp = "192.168.0.106";

export const transportOptions: WebRtcTransportOptions = {
  listenIps: [{ ip: "0.0.0.0", announcedIp: testIp }],
  enableTcp: true,
  enableUdp: true,
  preferUdp: true,
};

export async function createMediasoupWorker() {
  const worker = await createWorker();

  console.log("mediasoup worker created: ", worker.pid);

  worker.on("died", (error) => {
    console.log("mediasoup worker died: ", worker.pid);
  });

  return worker;
}

export async function createMediasoupRouter(worker: Worker<AppData>) {
  return await worker.createRouter({ mediaCodecs: mediacodecs });
}

export async function createMediasoupTransport(
  router: Router<AppData>,
  // callback: (params: any) => void,
  callback: any,
) {
  try {
    const transport = await router.createWebRtcTransport(transportOptions);
    console.log("creating transport: ", transport.id);
    transport.on("dtlsstatechange", (state) => {
      if (state === "closed") {
        transport.close();
      }
    });

    transport.on("@close", () => {
      console.log("transport closed");
    });

    callback({
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });

    return transport;
  } catch (error) {
    console.log(error);
    callback({ params: { error: error } });
  }
}
