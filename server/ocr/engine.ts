import { createWorker, Worker, PSM } from 'tesseract.js';
import { extractDateCandidates, DateCandidate } from '../services/dateParser';

export interface OCRProcessResult {
  rawText: string;
  confidence: number;
  candidates: DateCandidate[];
  processingTimeMs: number;
}

class OCREngine {
  private worker: Worker | null = null;
  private workerInitPromise: Promise<Worker> | null = null;
  private isProcessing = false;
  private readonly TIMEOUT_MS = 30000; // 30 second timeout

  /**
   * Initializes or reuses the shared Tesseract worker.
   */
  public async getWorker(): Promise<Worker> {
    if (this.worker) {
      return this.worker;
    }

    if (this.workerInitPromise) {
      return this.workerInitPromise;
    }

    this.workerInitPromise = (async () => {
      console.log('🤖 Initializing SurplusLabel OCR Worker (Tesseract.js)...');
      const worker = await createWorker('eng');
      
      // Configure page segmentation mode for sparse packaging text
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT, // Sparse text detection
      });

      this.worker = worker;
      console.log('✅ OCR Worker ready for packaging date extraction.');
      return worker;
    })().catch((err) => {
      this.workerInitPromise = null;
      this.worker = null;
      console.error('❌ Failed to initialize OCR worker:', err);
      throw new Error(`Failed to initialize OCR engine: ${err.message}`);
    });

    return this.workerInitPromise;
  }

  /**
   * Processes an in-memory image buffer, extracts raw text, and detects date candidates.
   */
  public async processImageBuffer(
    buffer: Buffer,
    _originalFilename = 'food-label.jpg'
  ): Promise<OCRProcessResult> {
    const startTime = Date.now();
    const worker = await this.getWorker();

    // Prevent concurrent execution on the same worker if it gets overwhelmed
    while (this.isProcessing) {
      await new Promise((res) => setTimeout(res, 100));
    }

    this.isProcessing = true;

    try {
      // Execute recognition with timeout protection
      const recognizePromise = worker.recognize(buffer);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('OCR processing timed out after 30 seconds.')),
          this.TIMEOUT_MS
        )
      );

      const result = await Promise.race([recognizePromise, timeoutPromise]);
      const rawText = result.data.text || '';
      const confidence = Math.round(result.data.confidence || 0);

      // Parse candidates using the date parsing engine
      const candidates = extractDateCandidates(rawText, confidence);
      const processingTimeMs = Date.now() - startTime;

      return {
        rawText,
        confidence,
        candidates,
        processingTimeMs,
      };
    } catch (err: any) {
      console.error('[OCR Engine Processing Error]:', err?.message || err);
      
      // If worker crashed or timed out, reset it so future requests can recover
      if (err?.message?.includes('timed out') || err?.message?.includes('dead')) {
        await this.terminate();
      }

      throw err;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Safely terminates the active worker instance.
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (e) {
        console.warn('Warning during OCR worker termination:', e);
      }
      this.worker = null;
      this.workerInitPromise = null;
      this.isProcessing = false;
    }
  }
}

export const ocrEngine = new OCREngine();
