# ─── Stage: development ──────────────────────────────────────────────────────
# Runs ts-node + nodemon for hot-reload. Source is mounted via volume.
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json tsconfig.json nodemon.json ./
RUN npm install

# src/ is mounted at runtime via docker-compose volume
EXPOSE 5000

CMD ["npm", "run", "dev"]


# ─── Stage: builder ───────────────────────────────────────────────────────────
# Installs all deps (including devDeps) and compiles TypeScript → dist/
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install --legacy-peer-deps

COPY src/ ./src/
RUN npm run build


# ─── Stage: production ───────────────────────────────────────────────────────
# Minimal runtime image: only compiled JS + production node_modules.
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Drop root privileges
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
