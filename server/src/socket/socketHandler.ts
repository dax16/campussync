import { Server, Socket } from 'socket.io';
import { IBookingDocument } from '../models/Booking';

// Extends Server with the two custom emitter helpers added at startup.
export interface AppServer extends Server {
  bookingCreated?: (booking: IBookingDocument) => void;
  bookingCancelled?: (booking: IBookingDocument) => void;
}

const initSocket = (io: AppServer): void => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinRoom', (roomId: string) => {
      void socket.join(`room:${roomId}`);
    });

    socket.on('leaveRoom', (roomId: string) => {
      void socket.leave(`room:${roomId}`);
    });

    socket.on('watchDate', ({ roomId, date }: { roomId: string; date: string }) => {
      void socket.join(`availability:${roomId}:${date}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  io.bookingCreated = (booking: IBookingDocument): void => {
    io.to(`availability:${String(booking.room)}:${booking.date}`).emit('slotUpdated', {
      roomId: booking.room,
      date: booking.date,
      startTime: booking.startTime,
      available: false,
    });
  };

  io.bookingCancelled = (booking: IBookingDocument): void => {
    io.to(`availability:${String(booking.room)}:${booking.date}`).emit('slotUpdated', {
      roomId: booking.room,
      date: booking.date,
      startTime: booking.startTime,
      available: true,
    });
  };
};

export default initSocket;
