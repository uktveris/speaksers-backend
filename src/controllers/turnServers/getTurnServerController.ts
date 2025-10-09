import { Request, Response } from "express";
import axios from "axios";

export default async function getTurnServer(req: Request, res: Response) {
  console.log("turn server endpoint hit");
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const token = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;
  if (!keyId || !token) {
    console.log("no key or no token found");
    res.status(500).json({ error: "critical server error while getting turn server credentials" });
    return;
  }
  try {
    const response = await axios.post(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`,
      { ttl: 86400 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    console.log("called cloudflare servers, response:", JSON.stringify(response.data, null, 2));
    const servers = response.data.iceServers;
    res.status(200).json({ servers: servers });
  } catch (error) {
    console.log("error while getting cloudflare turn servers:", error);
    res.status(400).json({ error: "error while getting cloudflare TURN servers:" + error });
    return;
  }
}
