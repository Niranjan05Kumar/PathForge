# Multi-stage Dockerfile for PathForge
# Stage 1: Build native C++17 Algorithm Engine
FROM debian:bookworm-slim AS engine-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    ninja-build \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY engine/ /build/engine/
RUN cmake -S engine -B engine/build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
RUN cmake --build engine/build --target pathforge-engine

# Stage 2: Build React Vite Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 3: Build Node.js TypeScript Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build
RUN npm prune --production

# Stage 4: Production Runtime
FROM node:20-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy compiled C++ engine binary
COPY --from=engine-builder /build/engine/build/pathforge-engine /app/engine/build/pathforge-engine
RUN chmod +x /app/engine/build/pathforge-engine

# Copy compiled client static files
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy compiled server & production dependencies
COPY --from=server-builder /app/server/dist /app/server/dist
COPY --from=server-builder /app/server/node_modules /app/server/node_modules
COPY --from=server-builder /app/server/package.json /app/server/package.json

ENV NODE_ENV=production
ENV PORT=5000
ENV CPP_ENGINE_PATH=/app/engine/build/pathforge-engine

EXPOSE 5000

CMD ["node", "server/dist/server.js"]
