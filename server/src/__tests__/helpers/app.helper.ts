import { Application } from 'express';
import createApp from '../../app';
import env from '../../config/env';
import { AppServer } from '../../socket/socketHandler';

// Minimal socket.io mock — avoids real WebSocket overhead during HTTP tests.
const mockIo = {
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  bookingCreated: jest.fn(),
  bookingCancelled: jest.fn(),
} as unknown as AppServer;

let _app: Application | null = null;

export const getTestApp = (): Application => {
  if (!_app) {
    _app = createApp(env, mockIo);
  }
  return _app;
};

export { mockIo };
