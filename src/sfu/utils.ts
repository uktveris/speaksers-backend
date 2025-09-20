import { createWorker } from "mediasoup";
import { RouterRtpCodecCapability } from "mediasoup/node/lib/rtpParametersTypes";

const mediacodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

async function createMediasoupWorker() {
  const worker = await createWorker();

  console.log("mediasoup worker created: ", worker.pid);

  worker.on("died", (error) => {
    console.log("mediasoup worker died: ", worker.pid);
  });

  return worker;
}
