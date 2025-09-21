import { Consumer, Producer } from "mediasoup/node/lib/types";
import { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes";

export interface Peer {
  id: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export interface TransportRoom {
  id: string;
  peers: Map<string, Peer>;
}
