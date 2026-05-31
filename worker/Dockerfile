# Fly.io / generic Docker image for the worker.
# Multi-stage to keep the final image small.

FROM node:20-slim AS builder
WORKDIR /app

# Install ALL deps (incl. dev — needed for tsc)
COPY package*.json ./
RUN npm ci

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ──────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install ONLY prod deps in the runtime image
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Pull in the compiled JS
COPY --from=builder /app/dist ./dist

# Worker doesn't serve HTTP — no EXPOSE needed
CMD ["node", "dist/index.js"]
