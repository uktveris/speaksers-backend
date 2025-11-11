# speaksers-backend

Backend service for [speaksers](https://github.com/uktveris/speaksers-mobile?tab=readme-ov-file) mobile app, built with [Express](https://expressjs.com/). Provides features such as signalling for webrtc peer-to-peer calls. Exports logs to a dedicated [Supabase](https://supabase.com/) project. For some endpoints, JWT verification is made using supabase's SDK. Additionally, this backend serves as a WebRTC media server, integrating [mediasoup](https://mediasoup.org/) as a Selective Forwarding Unit (SFU). Mediasoup was chosen for its minimal and lightweight approach to managing RTC media as a WebRTC media server.

Switch to **develop** branch before running locally. The service can be executed within Docker container.

Install:
```bash
npm install
```

Run locally:
```bash
npm run dev
```

Build Docker image (with tag which is used later in compose):
```bash
docker build -t speaksers-backend:latest .
```

Run locally in Docker container:
```bash
docker compose -f compose.dev.yaml up
```
