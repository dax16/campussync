import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import env from './config/env';
import createApp from './app';
import { createSocketCorsOptions } from './config/security';
import initSocket, { AppServer } from './socket/socketHandler';

const startServer = async (): Promise<void> => {
  const server = http.createServer();

  const io = new Server(server, {
    cors: createSocketCorsOptions(env),
  }) as AppServer;

  const app = createApp(env, io);
  server.on('request', app);

  initSocket(io);

  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer().catch((err: unknown) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
