import { Request, Response, NextFunction } from 'express';
import { isAuthenticated } from '../lib/auth';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};
