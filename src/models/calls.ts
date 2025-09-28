import {
  AppData,
  Consumer,
  Producer,
  Router,
  RtpCapabilities,
} from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";

export interface Peer {
  id: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
  deviceRtpCapabilities?: RtpCapabilities;
  joined?: boolean;
}

export interface TransportRoom {
  id: string;
  peers: Map<string, Peer>;
  router?: Router<AppData>;
  rtpCapabilities?: RtpCapabilities;
}
