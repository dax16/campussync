# ─── Stage: development ──────────────────────────────────────────────────────
# Runs react-scripts start with hot-reload. Source is mounted via volume.
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install --legacy-peer-deps

# Bind to all interfaces so the container is reachable from the host
ENV HOST=0.0.0.0
# Use polling for file-watch compatibility inside Docker on Windows/Mac
ENV CHOKIDAR_USEPOLLING=true

# src/ and public/ are mounted at runtime via docker-compose volume
EXPOSE 3000

CMD ["npm", "start"]


# ─── Stage: builder ───────────────────────────────────────────────────────────
# Compiles the React app into a static bundle.
FROM node:20-alpine AS builder

WORKDIR /app

# REACT_APP_API_URL is baked into the build at compile time.
# Pass the URL of whichever host serves your API (usually nginx origin).
ARG REACT_APP_API_URL=http://localhost:3000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json tsconfig.json ./
RUN npm install --legacy-peer-deps

COPY public/ ./public/
COPY src/ ./src/

RUN npm run build


# ─── Stage: production ───────────────────────────────────────────────────────
# Serves the compiled bundle via nginx.
# nginx also reverse-proxies /api and /socket.io to the backend.
FROM nginx:1.27-alpine AS production

# Remove default nginx site config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
