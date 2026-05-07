import { IUserDocument } from '../models/User';
import { AppServer } from '../socket/socketHandler';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      io?: AppServer;
    }
  }
}

export {};
