import type { NextFunction, Request, Response } from 'express';

/**
 * Minimal per-request access logging (method, path, status, duration).
 * Replaces morgan('dev') from the legacy server/config/express.js -
 * there's no user/session context to carry here since auth isn't part
 * of the new app (see the design doc's "Auth/account/admin scope").
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
}
