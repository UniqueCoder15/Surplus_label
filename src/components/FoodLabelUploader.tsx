import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  FileImage,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Cloud,
  Sparkles,
} from 'lucide-react';
import {
  FoodLabelVerificationGateway,
  VerifiedFoodLabelData,
} from './FoodLabelVerificationGateway';
import { getApiUrl } from '../utils/api';

export interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  original_filename: string;
}

interface FoodLabelUploaderProps {
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  onRemove?: () => void;
  onVerificationComplete?: (verifiedData: VerifiedFoodLabelData) => void;
  enableOcrVerification?: boolean;
  className?: string;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const FoodLabelUploader: React.FC<FoodLabelUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  onRemove,
  onVerificationComplete,
  enableOcrVerification = true,
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [serverCloudinaryConfigured, setServerCloudinaryConfigured] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health and Cloudinary configuration status on mount
  useEffect(() => {
    let isMounted = true;
    fetch(getApiUrl('/api/health'))
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (isMounted && data?.cloudinary) {
          setServerCloudinaryConfigured(data.cloudinary.configured);
        }
      })
      .catch(() => {
        if (isMounted) setServerCloudinaryConfigured(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && !uploadResult) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, uploadResult]);

  const validateFile = (candidate: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(candidate.type)) {
      return `Unsupported format '${candidate.type || 'unknown'}'. Please upload a JPEG, PNG, or WebP image.`;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      const sizeMb = (candidate.size / (1024 * 1024)).toFixed(1);
      return `File size (${sizeMb} MB) exceeds maximum limit of 5.0 MB.`;
    }
    return null;
  };

  const handleFileSelection = (selectedFile: File) => {
    setErrorMessage(null);
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setErrorMessage(validationError);
      if (onUploadError) onUploadError(validationError);
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    setUploadProgress(0);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleLoadSampleLabel = async (sampleType: 'oats' | 'ramen' = 'oats', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const isOats = sampleType === 'oats';
      const sampleUrl = isOats ? '/sample-food-label-crisp.jpg' : '/sample-food-label.jpg';
      const fileName = isOats ? 'organic-whole-oats-label.jpg' : 'spicy-chicken-ramen-label.jpg';

      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const sampleFile = new File([blob], fileName, {
        type: 'image/jpeg',
      });
      handleFileSelection(sampleFile);
    } catch (err) {
      console.error('Failed to load sample label', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(15);

    // Simulated progress increment while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 150);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(getApiUrl('/api/uploads/food-label'), {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'CLOUDINARY_NOT_CONFIGURED') {
          const configMsg =
            'Cloudinary credentials are not configured on the server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env.';
          setErrorMessage(configMsg);
          setServerCloudinaryConfigured(false);
          if (onUploadError) onUploadError(configMsg);
          return;
        }

        const errText = data.error || 'Failed to upload image to server.';
        setErrorMessage(errText);
        if (onUploadError) onUploadError(errText);
        return;
      }

      if (data.success && data.data) {
        setUploadResult(data.data);
        if (onUploadSuccess) onUploadSuccess(data.data);
      } else {
        throw new Error(data.error || 'Unexpected upload response payload');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      const networkErr =
        err?.message || 'Network error: could not connect to upload server.';
      setErrorMessage(networkErr);
      if (onUploadError) onUploadError(networkErr);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (previewUrl && !uploadResult) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setErrorMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) onRemove();
  };

  const handleCopyUrl = () => {
    if (!uploadResult?.url) return;
    navigator.clipboard.writeText(uploadResult.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`sl-uploader ${className}`} aria-live="polite">
      {/* Cloudinary configuration badge/banner */}
      {serverCloudinaryConfigured === false && (
        <div className="sl-uploader-notice sl-uploader-notice--warning" role="alert">
          <AlertTriangle size={15} className="sl-text-warning" aria-hidden="true" />
          <span>
            <strong>Cloudinary Server Setup Required:</strong> Backend is running, but server credentials
            are unpopulated in <code>server/.env</code>.
          </span>
        </div>
      )}

      {/* 1. INITIAL DROPZONE (No file selected yet) */}
      {!file && !uploadResult && (
        <>
          <div
            className={`sl-dropzone ${isDragging ? 'sl-dropzone--dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Upload packaging label photo. Drag and drop file or press to browse."
          >
            <input
              ref={fileInputRef}
              type="file"
              className="sl-dropzone__input"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              aria-hidden="true"
              tabIndex={-1}
            />
            <div className="sl-dropzone__icon-wrap">
              <UploadCloud size={28} className="sl-text-primary" aria-hidden="true" />
            </div>
            <div className="sl-dropzone__text-group">
              <span className="sl-dropzone__main-text">
                <strong>Click to upload</strong> or drag &amp; drop food-label image
              </span>
              <span className="sl-dropzone__sub-text">
                Supported formats: JPEG, PNG, WebP (Max 5.0 MB)
              </span>
            </div>
            <button
              type="button"
              className="sl-btn sl-btn--secondary sl-btn--sm sl-dropzone__btn"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </button>
          </div>

          <div className="sl-dropzone-samples">
            <span className="sl-dropzone-samples__label">Quick Sample Label Presets:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="sl-dropzone-samples__btn"
                onClick={(e) => handleLoadSampleLabel('oats', e)}
                title="Crisp label with MFD: 15/04/2026, EXP: 28/11/2026, BEST BEFORE: 24/11/2026"
              >
                <Sparkles size={13} className="sl-text-primary" />
                <span>Preset 1: Organic Oats (Crisp OCR: MFD + EXP + BB)</span>
              </button>
              <button
                type="button"
                className="sl-dropzone-samples__btn"
                onClick={(e) => handleLoadSampleLabel('ramen', e)}
                title="Packaged photo with EXP: 28 NOV 2026"
              >
                <FileImage size={13} className="sl-text-primary" />
                <span>Preset 2: Chicken Ramen Packaging</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. SELECTED FILE PREVIEW & UPLOAD ACTION */}
      {file && !uploadResult && (
        <div className="sl-upload-preview-card">
          <div className="sl-upload-preview-card__header">
            <div className="sl-upload-preview-card__file-info">
              <FileImage size={18} className="sl-text-primary" aria-hidden="true" />
              <div>
                <span className="sl-upload-preview-card__filename">{file.name}</span>
                <span className="sl-upload-preview-card__filesize">
                  {formatFileSize(file.size)} • {file.type.replace('image/', '').toUpperCase()}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="sl-upload-preview-card__remove-btn"
              onClick={handleRemove}
              disabled={isUploading}
              aria-label="Remove selected image"
            >
              <X size={16} />
            </button>
          </div>

          {previewUrl && (
            <div className="sl-upload-preview-card__img-box">
              <img
                src={previewUrl}
                alt="Selected food-label preview"
                className="sl-upload-preview-card__img"
              />
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="sl-upload-progress">
              <div className="sl-upload-progress__label-row">
                <span className="sl-text-xs sl-text-muted">Streaming to Cloudinary CDN...</span>
                <span className="sl-text-xs sl-text-primary tabular-nums font-semibold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="sl-upload-progress__bar-track">
                <div
                  className="sl-upload-progress__bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="sl-upload-preview-card__actions">
            <button
              type="button"
              className="sl-btn sl-btn--secondary sl-btn--sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="sl-btn sl-btn--primary sl-btn--sm"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw size={14} className="sl-spin" aria-hidden="true" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <Cloud size={14} aria-hidden="true" />
                  <span>Upload Label Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. SUCCESSFUL UPLOAD RESULT STATE */}
      {uploadResult && (
        <div className="sl-upload-success-card">
          <div className="sl-upload-success-card__badge-row">
            <span className="sl-badge sl-badge--success sl-badge--sm">
              <CheckCircle2 size={13} aria-hidden="true" />
              <span>Secure Cloudinary Upload Verified</span>
            </span>
            <span className="sl-text-xs sl-text-muted tabular-nums">
              {uploadResult.width}×{uploadResult.height}px • {formatFileSize(uploadResult.bytes)}
            </span>
          </div>

          <div className="sl-upload-success-card__content">
            <div className="sl-upload-success-card__thumb-wrap">
              <img
                src={uploadResult.url}
                alt={`Uploaded ${uploadResult.original_filename}`}
                className="sl-upload-success-card__thumb"
              />
            </div>

            <div className="sl-upload-success-card__meta">
              <div className="sl-upload-meta-row">
                <span className="sl-upload-meta-label">Cloudinary Public ID:</span>
                <code className="sl-upload-meta-code">{uploadResult.public_id}</code>
              </div>
              <div className="sl-upload-meta-row">
                <span className="sl-upload-meta-label">Secure CDN URL:</span>
                <div className="sl-upload-meta-url-box">
                  <span className="sl-upload-meta-url">{uploadResult.url}</span>
                  <button
                    type="button"
                    className="sl-btn-icon"
                    onClick={handleCopyUrl}
                    aria-label="Copy Cloudinary URL"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={14} className="sl-text-primary" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={uploadResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sl-btn-icon"
                    aria-label="Open uploaded image in new tab"
                    title="Open Image"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="sl-upload-success-card__footer">
            <span className="sl-text-xs sl-text-muted">
              Ready for OCR date extraction &amp; supervisor safety verification.
            </span>
            <button
              type="button"
              className="sl-btn sl-btn--secondary sl-btn--sm"
              onClick={handleRemove}
            >
              Upload Different Image
            </button>
          </div>
        </div>
      )}

      {/* 4. INTEGRATED OCR & HUMAN VERIFICATION GATEWAY */}
      {enableOcrVerification && (file || uploadResult) && (
        <FoodLabelVerificationGateway
          imageFile={file}
          imagePreviewUrl={previewUrl}
          cloudinaryUrl={uploadResult?.url}
          cloudinaryPublicId={uploadResult?.public_id}
          onVerificationComplete={onVerificationComplete}
          onImageChangeRequest={handleRemove}
        />
      )}

      {/* ERROR FEEDBACK BANNER */}
      {errorMessage && (
        <div className="sl-uploader-error" role="alert">
          <AlertTriangle size={16} className="sl-text-danger" aria-hidden="true" />
          <div className="sl-uploader-error__text">
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            className="sl-uploader-error__close"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
