import { Request, Response, NextFunction } from 'express';
import { authService, SafeUser, UserRole } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser | null;
    }
  }
}

export function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies.sl_auth_token) {
    return req.cookies.sl_auth_token;
  }

  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)sl_auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    next();
    return;
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    req.user = null;
    next();
    return;
  }

  const user = await authService.findById(payload.sub);
  req.user = user || null;
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.',
    });
    return;
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please sign in again.',
    });
    return;
  }

  const user = await authService.findById(payload.sub);
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'User account not found. Please sign in again.',
    });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role "${req.user.role}" is not authorized for this operation (required: ${allowedRoles.join(
          ' or '
        )}).`,
      });
      return;
    }

    next();
  };
}
