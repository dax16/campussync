import express, { Request, Response } from 'express';
import Room from '../models/Room';
import Booking from '../models/Booking';
import User from '../models/User';
import { adminAuth } from '../middleware/auth';
import { validate, roomCreationValidator } from '../middleware/validators';
import { BookingStatus, RoomType, UserRole, AdminStats } from '../types';

const router = express.Router();

router.get('/stats', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0] as string;

    const [totalBookings, totalUsers, totalRooms, todayBookings, popularRooms, hourlyData] =
      await Promise.all([
        Booking.countDocuments({ status: BookingStatus.CONFIRMED }),
        User.countDocuments({ role: UserRole.STUDENT }),
        Room.countDocuments({ isActive: true }),
        Booking.countDocuments({ date: todayStr, status: BookingStatus.CONFIRMED }),
        Booking.aggregate([
          { $match: { status: BookingStatus.CONFIRMED } },
          { $group: { _id: '$room', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'rooms', localField: '_id', foreignField: '_id', as: 'room' } },
          { $unwind: '$room' },
          { $project: { name: '$room.name', building: '$room.building', count: 1 } },
        ]),
        Booking.aggregate([
          { $match: { status: BookingStatus.CONFIRMED } },
          { $group: { _id: '$startTime', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const stats: AdminStats = { totalBookings, totalUsers, totalRooms, todayBookings, popularRooms, hourlyData };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

router.post('/rooms', adminAuth, roomCreationValidator, validate, async (req: Request, res: Response): Promise<void> => {
  try {
    const room = new Room(req.body as {
      name: string;
      building: string;
      floor: number;
      capacity: number;
      type?: RoomType;
      amenities?: string[];
      imageUrl?: string;
    });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

router.get('/bookings', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email studentId')
      .populate('room', 'name building')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

router.post('/seed', adminAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const seedRooms = [
      { name: 'Study Room A', building: 'LRC', floor: 2, capacity: 6, type: RoomType.STUDY_ROOM, amenities: ['Whiteboard', 'TV Screen', 'Power Outlets'] },
      { name: 'Study Room B', building: 'LRC', floor: 2, capacity: 4, type: RoomType.STUDY_ROOM, amenities: ['Whiteboard', 'Power Outlets'] },
      { name: 'Computer Lab 101', building: 'NX', floor: 1, capacity: 30, type: RoomType.COMPUTER_LAB, amenities: ['30 PCs', 'Projector', 'AC'] },
      { name: 'Meeting Room 201', building: 'GH', floor: 2, capacity: 10, type: RoomType.MEETING_ROOM, amenities: ['Projector', 'Video Conferencing', 'Whiteboard'] },
      { name: 'AI Research Lab', building: 'NX', floor: 3, capacity: 15, type: RoomType.LAB, amenities: ['GPUs', 'High-Speed Internet', 'Standing Desks'] },
      { name: 'Collaboration Hub', building: 'LRC', floor: 1, capacity: 20, type: RoomType.MEETING_ROOM, amenities: ['Multiple Screens', 'Lounge Seating', 'Whiteboard Wall'] },
    ];

    await Promise.all(
      seedRooms.map((room) =>
        Room.updateOne(
          { name: room.name, building: room.building },
          { $setOnInsert: room },
          { upsert: true },
        ),
      ),
    );

    const count = await Room.countDocuments({ isActive: true });
    res.json({ message: 'Rooms seeded', count });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
