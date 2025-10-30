# speaksers-backend

Minimal backend for [speaksers](https://github.com/uktveris/speaksers-mobile?tab=readme-ov-file) mobile app, built with [Express](https://expressjs.com/). Provides features such as signalling for webrtc peer-to-peer calls. Exports logs to a dedicated [Supabase](https://supabase.com/) project. For some endpoints, JWT verification is made using supabase's SDK.

Switch to **development** branch before running locally. Can be executed within Docker container.

Install:
```bash
npm install
```

Run locally:
```bash
npm run dev
```

Run locally in Docker container:
```bash
docker compose -f compose.dev.yaml up
```
