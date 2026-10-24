import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileText,
  Tag,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DateType } from '../utils/ocrDateParser';

interface AddFoodScreenProps {
  onNavigate: (screen: string) => void;
}

export const AddFoodScreen: React.FC<AddFoodScreenProps> = ({ onNavigate }) => {
  const { user, authFetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields (Food Details)
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('packets');
  const [category, setCategory] = useState('canned_packaged');
  const [storageCondition, setStorageCondition] = useState('ambient');
  const [pickupLocation, setPickupLocation] = useState('Distribution Bay 3, Central Hub');
  const [notes, setNotes] = useState('');

  // Automatically Extracted Dates (NO manual input fields)
  const [extractedExpiryDate, setExtractedExpiryDate] = useState<string | null>(null);
  const [extractedMfgDate, setExtractedMfgDate] = useState<string | null>(null);
  const [extractedBestBeforeDate, setExtractedBestBeforeDate] = useState<string | null>(null);
  const [extractedBatchNumber, setExtractedBatchNumber] = useState<string | null>(null);
  const [extractedDateType, setExtractedDateType] = useState<DateType>('expiry');

  // OCR Status States
  const [ocrStatus, setOcrStatus] = useState<
    'idle' | 'scanning' | 'detected' | 'mfg_only' | 'not_detected'
  >('idle');
  const [ocrStatusText, setOcrStatusText] = useState<string>('No label uploaded yet');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [rawOcrSnippet, setRawOcrSnippet] = useState<string>('');

  // Image & Verification States
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Form Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Resets all previous OCR extraction states to prevent stale date persistence.
   */
  const clearPreviousExtraction = () => {
    setExtractedExpiryDate(null);
    setExtractedMfgDate(null);
    setExtractedBestBeforeDate(null);
    setExtractedBatchNumber(null);
    setExtractedDateType('expiry');
    setRawOcrSnippet('');
    setOcrConfidence(null);
    setIsVerified(false);
    setError(null);
  };

  /**
   * Executes the real Tesseract OCR pipeline on the backend.
   * Completely avoids any mocked or hardcoded dates.
   */
  const runOcrPipeline = async (file: File) => {
    clearPreviousExtraction();
    setImageFile(file);

    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    setIsUploading(true);
    setOcrStatus('scanning');
    setOcrStatusText('Analyzing label with OCR...');
    setUploadProgress('Running Tesseract.js packaging date recognition...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Call backend OCR route (both /food-label and /scan-label are supported)
      const res = await authFetch('/api/ocr/food-label', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const data = json.data;
        const rawText = data.rawText || '';
        setRawOcrSnippet(rawText);
        setOcrConfidence(
          typeof data.confidence === 'number'
            ? data.confidence
            : data.confidenceScore || 0
        );

        if (data.status === 'detected') {
          setOcrStatus('detected');
          setOcrStatusText(data.statusText || 'Dates detected');
          setExtractedExpiryDate(
            data.expiryDate || data.bestBeforeDate || data.primaryDate || null
          );
          setExtractedMfgDate(data.manufacturingDate || null);
          setExtractedBestBeforeDate(data.bestBeforeDate || null);
          setExtractedBatchNumber(data.batchNumber || null);
          setExtractedDateType(data.detectedDateType || 'expiry');
        } else if (data.status === 'mfg_only') {
          setOcrStatus('mfg_only');
          setOcrStatusText(data.statusText || 'Only MFG date detected');
          setExtractedMfgDate(data.manufacturingDate || null);
          setExtractedExpiryDate(null);
          setExtractedBestBeforeDate(null);
          setExtractedBatchNumber(data.batchNumber || null);
          setExtractedDateType('manufacturing');
          setError(
            data.message ||
              'Only manufacturing date detected. An identifiable expiry or best-before date is required to create a verified listing.'
          );
        } else {
          setOcrStatus('not_detected');
          setOcrStatusText('Could not confidently detect dates');
          setExtractedExpiryDate(null);
          setExtractedMfgDate(null);
          setExtractedBestBeforeDate(null);
          setExtractedBatchNumber(null);
          setError(
            data.message ||
              'Could not confidently detect dates from uploaded label. Please upload a clearer photograph of the printed package label.'
          );
        }
      } else {
        setOcrStatus('not_detected');
        setOcrStatusText('Could not confidently detect dates');
        setExtractedExpiryDate(null);
        setExtractedMfgDate(null);
        setExtractedBestBeforeDate(null);
        setExtractedBatchNumber(null);
        setError(
          json.error ||
            'Could not process packaging label. Please upload a clear, unblurred photo.'
        );
      }
    } catch (err: any) {
      console.error('OCR pipeline failure:', err);
      setOcrStatus('not_detected');
      setOcrStatusText('Could not confidently detect dates');
      setExtractedExpiryDate(null);
      setExtractedMfgDate(null);
      setExtractedBestBeforeDate(null);
      setExtractedBatchNumber(null);
      setError(
        err?.message ||
          'Network or processing error during OCR. Please try again with a clear photo.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    runOcrPipeline(file);
  };

  /**
   * Helper to test the real OCR pipeline with bundled sample labels.
   */
  const handleLoadSampleLabel = async (samplePath: string, sampleLabel: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(`Loading sample: ${sampleLabel}...`);
      const response = await fetch(samplePath);
      const blob = await response.blob();
      const filename = samplePath.split('/').pop() || 'sample.jpg';
      const file = new File([blob], filename, {
        type: blob.type || 'image/jpeg',
      });
      runOcrPipeline(file);
    } catch (err) {
      console.error('Failed to load sample label:', err);
      setError('Failed to load sample label. Please upload your own photo.');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!foodName.trim()) {
      setError('Please provide the food product name.');
      return;
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please provide a valid quantity greater than 0.');
      return;
    }

    const finalRelevantDate = extractedExpiryDate || extractedBestBeforeDate;
    if (!finalRelevantDate) {
      setError(
        'A printed label with a confidently detected expiry or best-before date is required. Please upload a clear label image.'
      );
      return;
    }

    if (!isVerified) {
      setError(
        'Mandatory food safety sign-off: Please check the verification box to confirm the extracted dates match the physical package label.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title: foodName.trim(),
        category,
        quantity: qtyNum,
        unit,
        storageCondition,
        handlingNotes: notes.trim(),
        donorOrg: user?.organizationName || 'Central Pantry Donor Hub',
        pickupLocation: pickupLocation.trim() || 'Sector 62, Noida',
        contactPhone: user?.phone || '+1 (555) 234-5678',
        imageUrl: imagePreview || '/noodles.jpg',
        relevantDate: finalRelevantDate,
        dateType: extractedDateType,
        manufacturingDate: extractedMfgDate || undefined,
        expiryDate: extractedExpiryDate || undefined,
        batchNumber: extractedBatchNumber || undefined,
        isManuallyConfirmed: true,
        verifiedBy: user?.contactName || 'Authorized Staff',
        rawOcrText: rawOcrSnippet || undefined,
        ocrConfidence: ocrConfidence || undefined,
      };

      const res = await authFetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('donor');
        }, 1000);
      } else {
        setError(json.error || 'Failed to submit food listing.');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'Network error creating listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (ocrStatus) {
      case 'scanning':
        return (
          <span className="sl-auto-badge sl-auto-badge--scanning">
            <Clock size={12} className="animate-spin" />
            <span>{ocrStatusText}</span>
          </span>
        );
      case 'detected':
        return (
          <span className="sl-auto-badge sl-auto-badge--success">
            <CheckCircle2 size={12} />
            <span>{ocrStatusText} {ocrConfidence ? `(${ocrConfidence}%)` : ''}</span>
          </span>
        );
      case 'mfg_only':
        return (
          <span className="sl-auto-badge sl-auto-badge--warning">
            <AlertTriangle size={12} />
            <span>{ocrStatusText}</span>
          </span>
        );
      case 'not_detected':
        return (
          <span className="sl-auto-badge sl-auto-badge--danger">
            <AlertCircle size={12} />
            <span>{ocrStatusText}</span>
          </span>
        );
      default:
        return (
          <span className="sl-auto-badge sl-auto-badge--idle">
            <Camera size={12} />
            <span>{ocrStatusText}</span>
          </span>
        );
    }
  };

  return (
    <div className="sl-add-food-page-ref">
      <div className="sl-container">
        {/* Navigation / Header */}
        <div className="sl-add-food-header-ref">
          <button
            type="button"
            className="sl-back-btn-ref"
            onClick={() => onNavigate('donor')}
          >
            <ArrowLeft size={18} />
            <span>Add Food Listing</span>
          </button>
          <p className="sl-add-food-sub-ref">
            Upload package label photo for automatic date extraction. Manual date entry is eliminated for food safety.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="sl-auth-error-banner-ref" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="sl-auth-success-banner-ref" role="status">
            <CheckCircle2 size={18} />
            <span>Food listing submitted successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {/* Two-Column Form */}
        <form onSubmit={handleSubmit} className="sl-add-food-grid-ref">
          {/* Left Column: Food Details & Automatic Extracted Dates Card */}
          <div className="sl-add-food-left-card-ref">
            <div className="sl-form-field-ref">
              <label className="sl-form-label-ref" htmlFor="food-name">
                Food Name <span className="sl-required-ref">*</span>
              </label>
              <input
                id="food-name"
                type="text"
                className="sl-text-input-ref"
                placeholder="e.g., Biscuits, Noodles, Milk, Oats etc."
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                required
              />
            </div>

            <div className="sl-form-row-2-ref">
              <div className="sl-form-field-ref">
                <label className="sl-form-label-ref" htmlFor="food-qty">
                  Quantity <span className="sl-required-ref">*</span>
                </label>
                <input
                  id="food-qty"
                  type="number"
                  min="1"
                  className="sl-text-input-ref"
                  placeholder="e.g., 20"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="sl-form-field-ref">
                <label className="sl-form-label-ref" htmlFor="food-unit">
                  Unit
                </label>
                <select
                  id="food-unit"
                  className="sl-select-input-ref"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                >
                  <option value="packets">packets</option>
                  <option value="boxes">boxes</option>
                  <option value="packs">packs</option>
                  <option value="cartons">cartons</option>
                  <option value="cans">cans</option>
                  <option value="loaves">loaves</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            {/* AUTOMATIC PACKAGING DATES CARD (No manual date entry fields) */}
            <div className="sl-auto-dates-panel">
              <div className="sl-auto-dates-header">
                <div className="sl-auto-dates-title">
                  <Sparkles size={16} className="sl-text-primary" />
                  <span>Automatic Label Dates (OCR)</span>
                </div>
                {getStatusBadge()}
              </div>

              <div className="sl-auto-dates-grid">
                {/* Expiry / Use By Date */}
                <div
                  className={`sl-auto-date-item ${
                    extractedExpiryDate ? 'sl-auto-date-item--highlight' : ''
                  }`}
                >
                  <div className="sl-auto-date-label">
                    Expiry / Best Before Date
                  </div>
                  <div
                    className={
                      extractedExpiryDate
                        ? 'sl-auto-date-value'
                        : 'sl-auto-date-value--empty'
                    }
                  >
                    {extractedExpiryDate ||
                      (ocrStatus === 'scanning'
                        ? 'Extracting...'
                        : 'Pending label upload')}
                  </div>
                </div>

                {/* Manufacturing Date */}
                <div className="sl-auto-date-item">
                  <div className="sl-auto-date-label">Manufacturing Date (MFD)</div>
                  <div
                    className={
                      extractedMfgDate
                        ? 'sl-auto-date-value'
                        : 'sl-auto-date-value--empty'
                    }
                  >
                    {extractedMfgDate ||
                      (ocrStatus === 'scanning'
                        ? 'Extracting...'
                        : 'Not detected on label')}
                  </div>
                </div>

                {/* Batch / Lot Number */}
                <div className="sl-auto-date-item">
                  <div className="sl-auto-date-label">Batch / Lot Number</div>
                  <div
                    className={
                      extractedBatchNumber
                        ? 'sl-auto-date-value'
                        : 'sl-auto-date-value--empty'
                    }
                  >
                    {extractedBatchNumber ||
                      (ocrStatus === 'scanning'
                        ? 'Extracting...'
                        : 'Not detected on label')}
                  </div>
                </div>

                {/* Date Classification */}
                <div className="sl-auto-date-item">
                  <div className="sl-auto-date-label">Classification</div>
                  <div className="sl-auto-date-value" style={{ textTransform: 'capitalize' }}>
                    {extractedDateType === 'best_before'
                      ? 'Best Before'
                      : extractedDateType === 'use_by'
                      ? 'Use By'
                      : extractedDateType === 'manufacturing'
                      ? 'Manufacturing'
                      : 'Expiry Date'}
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#64748B',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={14} className="sl-text-primary" />
                <span>
                  Dates are automatically extracted from your package label photo. Manual date entry is disabled for tamper prevention.
                </span>
              </p>
            </div>

            <div className="sl-form-field-ref">
              <label className="sl-form-label-ref" htmlFor="food-category">
                Category
              </label>
              <select
                id="food-category"
                className="sl-select-input-ref"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="canned_packaged">Packaged Snacks &amp; Noodles</option>
                <option value="bakery">Bakery &amp; Biscuits</option>
                <option value="dairy">Dairy &amp; Milk</option>
                <option value="pantry_grains">Grains &amp; Cereals</option>
                <option value="beverages">Beverages</option>
                <option value="produce">Fresh Produce</option>
                <option value="prepared_meals">Prepared Meals</option>
              </select>
            </div>

            <div className="sl-form-row-2-ref">
              <div className="sl-form-field-ref">
                <label className="sl-form-label-ref" htmlFor="storage-condition">
                  Storage Condition
                </label>
                <select
                  id="storage-condition"
                  className="sl-select-input-ref"
                  value={storageCondition}
                  onChange={(e) => setStorageCondition(e.target.value)}
                >
                  <option value="ambient">Ambient (Room Temperature)</option>
                  <option value="cool_dry">Cool &amp; Dry Place</option>
                  <option value="chilled">Refrigerated (2°C - 4°C)</option>
                  <option value="frozen">Frozen (-18°C)</option>
                </select>
              </div>

              <div className="sl-form-field-ref">
                <label className="sl-form-label-ref" htmlFor="pickup-loc">
                  Pickup Location
                </label>
                <input
                  id="pickup-loc"
                  type="text"
                  className="sl-text-input-ref"
                  placeholder="e.g. Sector 62, Noida"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="sl-form-field-ref">
              <label className="sl-form-label-ref" htmlFor="food-notes">
                Additional Notes (optional)
              </label>
              <textarea
                id="food-notes"
                rows={3}
                className="sl-textarea-input-ref"
                placeholder="e.g. storage instructions, package integrity notes."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Food Label Uploader & Verification */}
          <div className="sl-add-food-right-card-ref">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="sl-form-label-ref" style={{ margin: 0 }}>
                Upload Printed Food Label <span className="sl-required-ref">*</span>
              </label>
              {ocrStatus === 'detected' && (
                <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
                  ✓ OCR Verified
                </span>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              className="sl-dropzone-ref"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="label-image-input"
                accept="image/*"
                className="sl-file-hidden-input-ref"
                onChange={handleImageSelect}
              />
              <div className="sl-dropzone-label-ref">
                <div className="sl-dropzone-icon-box-ref">
                  <Upload size={24} />
                </div>
                <div className="sl-dropzone-text-ref">
                  <strong>Drag &amp; drop an image here</strong> or click to browse
                </div>
                <div className="sl-dropzone-subtext-ref">
                  Clear photograph of printed label showing MFG / EXP / BEST BEFORE (JPG, PNG)
                </div>
              </div>
            </div>

            {/* Quick Presets for Real OCR Testing */}
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Quick Test Samples:
              </span>
              <div className="sl-sample-presets-row">
                <button
                  type="button"
                  className="sl-sample-preset-btn"
                  onClick={() =>
                    handleLoadSampleLabel(
                      '/sample-food-label-crisp.jpg',
                      'Crisp Oats (MFD + EXP + BB)'
                    )
                  }
                  title="Test OCR on real label with MFD: 15/04/2026, EXP: 28/11/2026, BEST BEFORE: 24/11/2026"
                >
                  <Sparkles size={13} className="sl-text-primary" />
                  <span>Crisp Oats (MFD + EXP + BB)</span>
                </button>
                <button
                  type="button"
                  className="sl-sample-preset-btn"
                  onClick={() =>
                    handleLoadSampleLabel(
                      '/noodles.jpg',
                      'Instant Noodles Pack'
                    )
                  }
                  title="Test OCR on noodles package"
                >
                  <Tag size={13} className="sl-text-primary" />
                  <span>Noodles Pack</span>
                </button>
              </div>
            </div>

            {/* Processing Indicator */}
            {isUploading && (
              <div className="sl-ocr-progress-ref">
                <div className="sl-spinner-ref" />
                <span>{uploadProgress || 'Processing image with OCR...'}</span>
              </div>
            )}

            {/* Uploaded Image Preview & Extraction Card */}
            <div className="sl-upload-preview-container-ref">
              <div className="sl-upload-preview-box-ref">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Food label preview"
                    className="sl-upload-preview-img-ref"
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#94A3B8',
                    }}
                  >
                    <Camera size={36} />
                    <span style={{ fontSize: '0.8125rem' }}>No image uploaded yet</span>
                  </div>
                )}
              </div>

              {/* Recognized Raw Text Snippet */}
              {rawOcrSnippet && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#475569',
                      textTransform: 'uppercase',
                      marginBottom: '4px',
                    }}
                  >
                    <FileText size={12} />
                    <span>Recognized Label Text Snippet:</span>
                  </div>
                  <div className="sl-ocr-snippet-box">{rawOcrSnippet.trim()}</div>
                </div>
              )}

              {/* Visual Verification Checkbox */}
              <div className="sl-ocr-result-card-ref">
                <label className="sl-verify-checkbox-label-ref">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="sl-checkbox-ref"
                    disabled={!extractedExpiryDate || ocrStatus !== 'detected'}
                  />
                  <span style={{ fontSize: '0.8125rem', color: '#1E293B' }}>
                    <strong>Mandatory Verification:</strong> I confirm the automatically extracted dates match the physical package label.
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sl-add-food-actions-ref">
              <button
                type="submit"
                className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--lg"
                disabled={
                  isSubmitting ||
                  isUploading ||
                  !extractedExpiryDate ||
                  !isVerified
                }
                title={
                  !extractedExpiryDate
                    ? 'Upload a label image with a detected expiry date to enable submission'
                    : !isVerified
                    ? 'Check the visual verification confirmation to submit'
                    : 'Submit verified food listing'
                }
              >
                {isSubmitting ? 'Submitting Listing...' : 'Submit Verified Listing'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
