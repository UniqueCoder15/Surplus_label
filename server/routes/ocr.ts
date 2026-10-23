import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware, validateImageSignature } from '../middleware/upload';
import { ocrEngine } from '../ocr/engine';

const router = Router();

/**
 * OCR Engine status check
 * GET /api/ocr/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'Tesseract.js',
    language: 'eng',
    service: 'surpluslabel-ocr',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Dedicated Food-Label OCR Endpoint
 * POST /api/ocr/food-label
 * Field name: 'image'
 */
router.post(
  ['/food-label', '/'],
  (req: Request, res: Response, next: NextFunction) => {
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
          error: err.message || 'Error processing uploaded file for OCR.',
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

      // Deep magic-byte file signature validation
      const signature = validateImageSignature(file.buffer);
      if (!signature.valid) {
        res.status(415).json({
          success: false,
          error:
            'File signature does not match allowed image types (JPEG, PNG, WebP). Renamed or disguised non-image files are rejected.',
        });
        return;
      }

      // Process image buffer directly in-memory through Tesseract worker
      const ocrResult = await ocrEngine.processImageBuffer(
        file.buffer,
        file.originalname
      );

      res.status(200).json({
        success: true,
        data: {
          rawText: ocrResult.rawText,
          confidence: ocrResult.confidence,
          candidates: ocrResult.candidates,
          processingTimeMs: ocrResult.processingTimeMs,
          fileInfo: {
            originalName: file.originalname,
            sizeBytes: file.size,
            mimeType: file.mimetype,
            detectedFormat: signature.detectedFormat,
          },
        },
      });
    } catch (err: any) {
      console.error('[OCR Route Error]:', err?.message || err);
      res.status(500).json({
        success: false,
        error:
          err?.message ||
          'Failed to process food label OCR. Please try again or enter dates manually.',
      });
    }
  }
);

export default router;
