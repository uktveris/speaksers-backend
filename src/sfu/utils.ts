import { createWorker } from "mediasoup";
import { PipeToRouterOptions, Router } from "mediasoup/node/lib/RouterTypes";
import { RouterRtpCodecCapability } from "mediasoup/node/lib/rtpParametersTypes";
import { AppData, TransportListenInfo, WebRtcTransportOptions } from "mediasoup/node/lib/types";
import { Worker } from "mediasoup/node/lib/types";

const mediacodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP;
const listenIp = process.env.MEDIASOUP_LISTEN_IP;
if (!announcedIp || !listenIp) {
  console.log("mediasoup utils: fatal: no announcedIp or listenIp found in env vars");
}

const minPort = Number(process.env.MEDIASOUP_MIN_PORT);
const maxPort = Number(process.env.MEDIASOUP_MAX_PORT);
if (!minPort || !maxPort) {
  console.log("mediasoup utils: fatal: no min or max port found in env vars");
}

const transportOptions: WebRtcTransportOptions = {
  listenIps: [{ ip: listenIp!, announcedIp: announcedIp }],
  enableTcp: true,
  enableUdp: true,
  preferUdp: true,
};

const listenInfo: TransportListenInfo = {
  protocol: "udp",
  ip: announcedIp!,
  portRange: { min: minPort, max: maxPort },
};

export async function createMediasoupWorker() {
  const worker = await createWorker({
    rtcMinPort: minPort,
    rtcMaxPort: maxPort,
  });

  console.log("mediasoup worker created: ", worker.pid);

  worker.on("died", (error) => {
    console.log("mediasoup worker died: ", worker.pid);
  });

  return worker;
}

export async function createMediasoupRouter(worker: Worker<AppData>) {
  const router = await worker.createRouter({ mediaCodecs: mediacodecs });
  const pipeToRouterOptions: PipeToRouterOptions = {
    router: router,
    listenInfo: listenInfo,
  };
  return router;
}

export async function createMediasoupTransport(router: Router<AppData>) {
  const transport = await router.createWebRtcTransport(transportOptions);
  transport.on("dtlsstatechange", (state) => {
    if (state === "closed") {
      transport.close();
    }
  });

  transport.on("@close", () => {
    console.log("transport closed");
  });
  const params = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };

  return { transport, params };
}
