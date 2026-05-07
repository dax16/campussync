import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

const validate = (req: Request, res: Response, next: NextFunction): void => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    next();
    return;
  }

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: (error as { path?: string }).path ?? 'unknown',
    message: error.msg as string,
  }));

  res.status(400).json({
    message: errors[0]?.message ?? 'Validation failed',
    errors,
  });
};

export default validate;
