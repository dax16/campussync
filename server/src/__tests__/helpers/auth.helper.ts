import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User, { IUserDocument } from '../../models/User';
import { UserRole } from '../../types';

const TEST_JWT_SECRET = process.env['JWT_SECRET'] ?? 'test-super-secret-jwt-key-for-testing-only';

export const generateToken = (userId: string): string =>
  jwt.sign({ userId }, TEST_JWT_SECRET, { expiresIn: '7d' });

export interface TestUserOptions {
  name?: string;
  studentId?: string;
  email?: string;
  password?: string;
  program?: string;
  semester?: number;
  role?: UserRole;
}

export const createTestUser = async (opts: TestUserOptions = {}): Promise<IUserDocument> => {
  const studentId = opts.studentId ?? 's99001';
  const hashedPassword = await bcrypt.hash(opts.password ?? 'Password123!', 10);

  const user = new User({
    name: opts.name ?? 'Test Student',
    email: opts.email ?? `${studentId}@campus.ca`,
    password: hashedPassword,
    studentId,
    program: opts.program ?? 'ITS',
    semester: opts.semester ?? 3,
    role: opts.role ?? UserRole.STUDENT,
  });

  return user.save();
};

export const createAdminUser = async (): Promise<IUserDocument> =>
  createTestUser({
    name: 'Admin User',
    studentId: 'sadmin1',
    email: 'sadmin1@campus.ca',
    role: UserRole.ADMIN,
  });

export const authHeader = (token: string): { Authorization: string } => ({
  Authorization: `Bearer ${token}`,
});
