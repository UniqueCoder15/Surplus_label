import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload';
import ocrRouter from './routes/ocr';
import listingsRouter from './routes/listings';
import authRouter from './routes/auth';
import cookieParser from 'cookie-parser';
import { isCloudinaryConfigured } from './cloudinary';
import { connectDatabase, isMongoConnected } from './db/connection';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const app = express();
const PORT = process.env.PORT || 5050;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.trim().replace(/\/+$/, '');
      if (
        allowedOrigins.indexOf(cleanOrigin) !== -1 ||
        (process.env.NODE_ENV === 'production' && /\.vercel\.app$/.test(cleanOrigin)) ||
        process.env.NODE_ENV === 'development'
      ) {
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

app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.redirect('/api/health');
});

app.use('/api/auth', authRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/listings', listingsRouter);
app.use('/api', uploadRouter);
app.use('/api/uploads', uploadRouter);

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err?.message || err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

function validateStartupEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const notices: string[] = [];

  if (isProd) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      notices.push(
        '⚠️  [SECURITY]: JWT_SECRET is unset or shorter than 32 characters in production. Set a random 32+ char secret.'
      );
    }
    if (!process.env.CLIENT_ORIGIN) {
      notices.push(
        '⚠️  [CORS]: CLIENT_ORIGIN is unset in production. Set to your production domains (e.g. https://surpluslabel.org).'
      );
    }
    if (!process.env.MONGODB_URI) {
      notices.push('⚠️  [DATABASE]: MONGODB_URI is required in production for persistent user and listing storage.');
    }
  }

  if (!isCloudinaryConfigured()) {
    notices.push(
      '⚠️  [CLOUDINARY]: Cloudinary credentials are not configured. Image uploads will return HTTP 503 until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.'
    );
  }

  if (notices.length > 0) {
    console.log('\n--- Startup Environment Notices ---');
    notices.forEach((n) => console.warn(n));
    console.log('------------------------------------\n');
  }
}

const HOST = '0.0.0.0';
let server: ReturnType<typeof app.listen> | undefined;

export async function startServer(): Promise<ReturnType<typeof app.listen>> {
  validateStartupEnvironment();

  const connected = await connectDatabase();
  if (!connected && process.env.NODE_ENV === 'production') {
    console.error('[Database] Cannot start in production without a valid MONGODB_URI connection.');
    process.exit(1);
  }
  if (!connected) {
    console.warn(
      '[Database] MongoDB is not connected. Auth and listing APIs will return HTTP 503 until MONGODB_URI is configured.'
    );
  }

  return new Promise((resolve) => {
    server = app.listen(Number(PORT), HOST, () => {
      console.log('====================================================');
      console.log(`🌿 SurplusLabel Backend running on http://${HOST}:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📤 Upload Endpoint: http://localhost:${PORT}/api/uploads/food-label`);
      console.log(`🔍 OCR Endpoint: http://localhost:${PORT}/api/ocr/food-label`);
      console.log(
        `☁️  Cloudinary Status: ${
          isCloudinaryConfigured() ? '✅ Configured' : '⚠️  Unconfigured (Credentials Required)'
        }`
      );
      console.log(
        `🗄️  MongoDB Status: ${isMongoConnected() ? '✅ Connected' : '⚠️  Not connected (set MONGODB_URI)'}`
      );
      if (fs.existsSync(distPath)) {
        console.log(`🌐 Unified Frontend: Serving production SPA from /dist`);
      }
      console.log('====================================================');
      resolve(server!);
    });
  });
}

const modulePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isDirectRun = invokedPath === modulePath;

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
export { server };
