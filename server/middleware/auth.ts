import { Request, Response, NextFunction } from 'express';
import { authService, SafeUser, UserRole } from '../services/authService';

// Extend Express Request interface to include optional user
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser | null;
    }
  }
}

/**
 * Extracts JWT token from either HttpOnly cookie or Authorization Bearer header
 */
export function extractToken(req: Request): string | null {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.sl_auth_token) {
    return req.cookies.sl_auth_token;
  }

  // 2. Fallback to raw Cookie header if cookie-parser was not used
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)sl_auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  // 3. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware: Optional authentication.
 * Attaches user to `req.user` if valid token exists, otherwise sets `req.user = null`.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    req.user = null;
    return next();
  }

  const user = authService.findById(payload.sub);
  req.user = user || null;
  next();
}

/**
 * Middleware: Mandatory authentication.
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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

  const user = authService.findById(payload.sub);
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

/**
 * Middleware: Role-Based Authorization Gate.
 * Enforces permissions for donor, recipient, or administrator roles.
 */
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
