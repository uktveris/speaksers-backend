FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  python3 \
  python3-pip \
  meson \
  ninja-build \
  pkg-config \
  git \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig*.json ./
RUN npm ci
COPY . .
RUN npm run build


FROM node:20-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  ca-certificates \
  libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/seedData ./seedData
COPY --from=builder /app/tsconfig*.json ./

EXPOSE 8080/tcp
EXPOSE 4000-4010/udp

CMD [ "npm", "run", "start" ]
