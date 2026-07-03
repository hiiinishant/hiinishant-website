import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, path, ip } = req;
  const timestamp = new Date().toISOString();

  // Log incoming request
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`[${timestamp}] ${method} ${path} - ${statusColor}${statusCode}${reset} - ${duration}ms`);
  });

  next();
};
