import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authenticate, requireAuth } from '../middleware/auth';

const router = Router();

const COOKIE_NAME = 'sl_auth_token';

function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * POST /api/auth/register
 * Public registration for food donors or recipient charities.
 * Role escalation protection: "admin" role cannot be selected via registration.
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, organizationName, contactName, phone, address } = req.body;

    const result = await authService.register({
      email,
      password,
      role,
      organizationName,
      contactName,
      phone,
      address,
    });

    setAuthCookie(res, result.token);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      user: result.user,
      token: result.token,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (err: any) {
    console.error('[Auth API] Register error:', err.message);
    res.status(err.status || 400).json({
      success: false,
      error: err.message || 'Registration failed.',
    });
  }
});

/**
 * POST /api/auth/login
 * User login with password hash validation and brute-force rate limiting.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const result = await authService.login({ email, password }, clientIp);

    setAuthCookie(res, result.token);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      user: result.user,
      token: result.token,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (err: any) {
    console.error('[Auth API] Login error:', err.message);
    res.status(err.status || 401).json({
      success: false,
      error: err.message || 'Invalid email or password.',
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieve the currently authenticated user's session.
 */
router.get('/me', authenticate, (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated. Session missing or expired.',
      user: null,
    });
  }

  res.json({
    success: true,
    user: req.user,
    data: {
      user: req.user,
    },
  });
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * POST /api/auth/reset-demo
 * Resets user database to seeded demo accounts.
 */
router.post('/reset-demo', (_req: Request, res: Response) => {
  authService.resetToDemo();
  res.json({
    success: true,
    message: 'User credentials reset to initial demo accounts.',
  });
});

export default router;
