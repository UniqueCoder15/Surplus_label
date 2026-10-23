import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import uploadRouter from './routes/upload';
import ocrRouter from './routes/ocr';
import listingsRouter from './routes/listings';
import authRouter from './routes/auth';
import cookieParser from 'cookie-parser';
import { isCloudinaryConfigured } from './cloudinary';

// Load .env files from server directory or project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();
const PORT = process.env.PORT || 5050;

// Configure CORS
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (sanitized, zero content/secrets logged)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root Health Check Alias (redirect to /api/health for platform probes)
app.get('/health', (_req: Request, res: Response) => {
  res.redirect('/api/health');
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/listings', listingsRouter);
app.use('/api', uploadRouter);
app.use('/api/uploads', uploadRouter);

// Serve static frontend bundle if dist directory exists (Unified Full-Stack Deployment)
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Client-side SPA routing fallback (for non-API GET requests)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// 404 handler for unknown API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Generic 404 handler for any other unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Centralized sanitized error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err?.message || err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

/**
 * Validates critical environment configuration at server boot
 */
function validateStartupEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const notices: string[] = [];

  if (isProd) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      notices.push('⚠️  [SECURITY]: JWT_SECRET is unset or shorter than 32 characters in production. Set a random 32+ char secret.');
    }
    if (!process.env.CLIENT_ORIGIN) {
      notices.push('⚠️  [CORS]: CLIENT_ORIGIN is unset in production. Set to your production domains (e.g. https://surpluslabel.org).');
    }
  }

  if (!isCloudinaryConfigured()) {
    notices.push('⚠️  [CLOUDINARY]: Cloudinary credentials are not configured. Image uploads will return HTTP 503 until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.');
  }

  if (notices.length > 0) {
    console.log('\n--- Startup Environment Notices ---');
    notices.forEach((n) => console.warn(n));
    console.log('------------------------------------\n');
  }
}

// Start Express Server
const server = app.listen(PORT, () => {
  validateStartupEnvironment();
  console.log('====================================================');
  console.log(`🌿 SurplusLabel Backend running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📤 Upload Endpoint: http://localhost:${PORT}/api/uploads/food-label`);
  console.log(`🔍 OCR Endpoint: http://localhost:${PORT}/api/ocr/food-label`);
  console.log(
    `☁️  Cloudinary Status: ${
      isCloudinaryConfigured() ? '✅ Configured' : '⚠️  Unconfigured (Credentials Required)'
    }`
  );
  if (fs.existsSync(distPath)) {
    console.log(`🌐 Unified Frontend: Serving production SPA from /dist`);
  }
  console.log('====================================================');
});

export default app;
export { server };
