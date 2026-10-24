import { Router, Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import { uploadMiddleware, validateImageSignature } from '../middleware/upload';
import { cloudinary, isCloudinaryConfigured } from '../cloudinary';
import { isMongoConnected } from '../db/connection';

const router = Router();

/**
 * Health check & configuration status endpoint
 * GET /api/health
 */
router.get('/health', (_req: Request, res: Response) => {
  const configured = isCloudinaryConfigured();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'surpluslabel-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    persistence: {
      type: 'mongodb-atlas',
      status: isMongoConnected() ? 'connected' : 'disconnected',
    },
    ocrEngine: {
      engine: 'tesseract.js',
      status: 'ready',
    },
    cloudinary: {
      configured,
      cloudName: configured ? process.env.CLOUDINARY_CLOUD_NAME : undefined,
      folder: process.env.CLOUDINARY_FOLDER || 'surpluslabel/food-labels',
    },
  });
});

/**
 * Single Food-Label Image Upload Endpoint
 * POST /api/uploads/food-label
 * Field name: 'image'
 */
router.post(
  '/food-label',
  (req: Request, res: Response, next: NextFunction) => {
    // Multer upload handling with custom error interceptor
    uploadMiddleware.single('image')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File size exceeds maximum allowed limit of 5 MB.',
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || 'Error processing uploaded file.',
        });
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          error: "No image file provided in request. Please use multipart field 'image'.",
        });
        return;
      }

      // Deep inspection: validate file magic bytes from buffer
      const signature = validateImageSignature(file.buffer);
      if (!signature.valid) {
        res.status(415).json({
          success: false,
          error:
            'Invalid file payload. The file signature does not match a valid JPEG, PNG, or WebP image.',
        });
        return;
      }

      // Check if Cloudinary credentials are configured
      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          success: false,
          code: 'CLOUDINARY_NOT_CONFIGURED',
          error:
            'Cloudinary credentials are not configured on the server. Please populate CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment or server/.env file.',
          fileInfo: {
            originalName: file.originalname,
            sizeBytes: file.size,
            mimeType: file.mimetype,
            detectedFormat: signature.detectedFormat,
          },
        });
        return;
      }

      // Stream buffer directly to Cloudinary
      const folder = process.env.CLOUDINARY_FOLDER || 'surpluslabel/food-labels';
      
      const uploadPromise = new Promise<{
        secure_url: string;
        public_id: string;
        format: string;
        width: number;
        height: number;
        bytes: number;
        created_at: string;
      }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
          },
          (error: any, result: any) => {
            if (error || !result) {
              return reject(error || new Error('Upload stream returned empty result'));
            }
            resolve(result as any);
          }
        );

        Readable.from(file.buffer).pipe(stream);
      });

      const result = await uploadPromise;

      res.status(201).json({
        success: true,
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at,
          original_filename: file.originalname,
        },
      });
    } catch (error: any) {
      console.error('[Upload Endpoint Error]:', error?.message || error);
      res.status(502).json({
        success: false,
        error: 'Failed to upload image to Cloudinary storage service.',
        details:
          process.env.NODE_ENV === 'development'
            ? error?.message
            : 'Upstream upload failure',
      });
    }
  }
);

export default router;
