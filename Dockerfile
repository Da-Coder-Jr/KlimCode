FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production ──────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/bin ./bin

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV KLIMCODE_PORT=7700
ENV KLIMCODE_HOST=0.0.0.0
ENV KLIMCODE_DB_PATH=/app/data/klimcode.db
ENV KLIMCODE_SANDBOX_DIR=/app/data/sandboxes

EXPOSE 7700

VOLUME ["/app/data"]

CMD ["node", "build/index.js"]
