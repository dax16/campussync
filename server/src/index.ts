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

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err: unknown) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
