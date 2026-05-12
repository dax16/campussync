import { body, ValidationChain } from 'express-validator';
import { STUDENT_EMAIL_DOMAIN } from '../../config/constants';

const normalizeString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeLowerString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export const registerValidator: ValidationChain[] = [
  body('name')
    .customSanitizer(normalizeString)
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),

  body('studentId')
    .customSanitizer(normalizeLowerString)
    .notEmpty()
    .withMessage('Student ID is required')
    .matches(/^s[0-9]+$/)
    .withMessage('Student ID must start with s and contain only numbers after it'),

  body('email')
    .customSanitizer(normalizeLowerString)
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .custom((email: string, { req }) => {
      const studentId = (req.body as { studentId?: string }).studentId;
      const expectedEmail = `${studentId}@${STUDENT_EMAIL_DOMAIN}`;

      if (studentId && /^s[0-9]+$/.test(studentId) && email !== expectedEmail) {
        throw new Error(`Email must match your Student ID: ${expectedEmail}`);
      }

      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .isLength({ max: 128 })
    .withMessage('Password cannot exceed 128 characters'),

  body('program')
    .optional()
    .customSanitizer(normalizeString)
    .isLength({ max: 100 })
    .withMessage('Program cannot exceed 100 characters'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8')
    .toInt(),
];

export const loginValidator: ValidationChain[] = [
  body('email')
    .customSanitizer(normalizeLowerString)
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),
];
