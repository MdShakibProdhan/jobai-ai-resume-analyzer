import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any, _req: Request, res: Response, _next: NextFunction
) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
