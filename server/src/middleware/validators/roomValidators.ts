import { body, ValidationChain } from 'express-validator';
import { RoomType } from '../../types';

const ROOM_TYPES = Object.values(RoomType);

const normalizeString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const roomCreationValidator: ValidationChain[] = [
  body('name')
    .customSanitizer(normalizeString)
    .notEmpty()
    .withMessage('Room name is required')
    .isLength({ max: 120 })
    .withMessage('Room name cannot exceed 120 characters'),

  body('building')
    .customSanitizer(normalizeString)
    .notEmpty()
    .withMessage('Building is required')
    .isLength({ max: 80 })
    .withMessage('Building cannot exceed 80 characters'),

  body('floor')
    .notEmpty()
    .withMessage('Floor is required')
    .isInt({ min: 0, max: 200 })
    .withMessage('Floor must be a valid number')
    .toInt(),

  body('capacity')
    .notEmpty()
    .withMessage('Room capacity is required')
    .isInt({ min: 1, max: 500 })
    .withMessage('Room capacity must be between 1 and 500')
    .toInt(),

  body('type')
    .optional()
    .isIn(ROOM_TYPES)
    .withMessage('Room type is invalid'),

  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .customSanitizer(normalizeString)
    .isLength({ min: 1, max: 80 })
    .withMessage('Each amenity must be between 1 and 80 characters'),

  body('imageUrl')
    .optional({ checkFalsy: true })
    .customSanitizer(normalizeString)
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Image URL must be a valid URL'),
];
