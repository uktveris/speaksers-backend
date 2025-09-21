import { createWorker } from "mediasoup";
import { Router } from "mediasoup/node/lib/RouterTypes";
import { RouterRtpCodecCapability } from "mediasoup/node/lib/rtpParametersTypes";
import { AppData, WebRtcTransportOptions } from "mediasoup/node/lib/types";

export const mediacodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

const testIp = "127.0.0.1";

export const transportOptions: WebRtcTransportOptions = {
  listenIps: ["0.0.0.0", testIp],
  enableTcp: true,
  enableUdp: true,
};

export async function createMediasoupWorker() {
  const worker = await createWorker();

  console.log("mediasoup worker created: ", worker.pid);

  worker.on("died", (error) => {
    console.log("mediasoup worker died: ", worker.pid);
  });

  return worker;
}

export function createTransport(router: Router<AppData>) {
  return router.createWebRtcTransport(transportOptions);
}
