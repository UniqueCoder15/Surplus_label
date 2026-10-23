import React, { useState, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  PackageCheck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  DateCandidate,
  DateType,
  UrgencyResult,
  calculateUrgency,
  isValidCalendarDate,
  formatDisplayDate,
} from '../utils/ocrDateParser';

export interface VerifiedFoodLabelData {
  verifiedDate: string; // YYYY-MM-DD
  dateType: DateType;
  urgency: UrgencyResult;
  allCandidates: DateCandidate[];
  rawText: string;
  ocrConfidence: number;
  verifiedAt: string;
  verifiedBy: string;
  isManuallyConfirmed: boolean;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

interface FoodLabelVerificationGatewayProps {
  imageFile?: File | null;
  imagePreviewUrl?: string | null;
  cloudinaryUrl?: string | null;
  cloudinaryPublicId?: string | null;
  onVerificationComplete?: (verifiedData: VerifiedFoodLabelData) => void;
  onImageChangeRequest?: () => void;
  initialDate?: string;
  initialDateType?: DateType;
  className?: string;
}

export const FoodLabelVerificationGateway: React.FC<FoodLabelVerificationGatewayProps> = ({
  imageFile,
  imagePreviewUrl,
  cloudinaryUrl,
  cloudinaryPublicId,
  onVerificationComplete,
  onImageChangeRequest,
  initialDate,
  initialDateType = 'expiry',
  className = '',
}) => {
  // OCR processing state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [hasScannedOnce, setHasScannedOnce] = useState(false);

  // Extracted Date Candidates
  const [candidates, setCandidates] = useState<DateCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Manual review & verification state
  const [manualDate, setManualDate] = useState<string>(initialDate || '');
  const [manualDateType, setManualDateType] = useState<DateType>(initialDateType);
  const [isSupervisorChecked, setIsSupervisorChecked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // UI accordion & copy state
  const [showRawText, setShowRawText] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);

  // Auto-trigger OCR once when a new imageFile is provided and hasn't scanned yet
  useEffect(() => {
    if (imageFile && !hasScannedOnce && !isScanning && candidates.length === 0) {
      runOcrScan(imageFile);
    }
  }, [imageFile]);

  // Execute OCR via backend endpoint /api/ocr/food-label
  const runOcrScan = async (fileToScan: File) => {
    setIsScanning(true);
    setScanError(null);
    setScanProgress(10);
    setIsVerified(false);

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 200);

    const formData = new FormData();
    formData.append('image', fileToScan);

    try {
      const response = await fetch('/api/ocr/food-label', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setScanProgress(100);

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(
          resData.error || 'Failed to scan image. Please try again or enter dates manually.'
        );
      }

      const { rawText, confidence, candidates: detectedCandidates } = resData.data;

      setRawOcrText(rawText || '');
      setOcrConfidence(confidence || 0);
      setCandidates(detectedCandidates || []);
      setHasScannedOnce(true);

      // Select first expiry / best_before candidate if available, else first candidate
      if (detectedCandidates && detectedCandidates.length > 0) {
        const primaryCand =
          detectedCandidates.find(
            (c: DateCandidate) =>
              c.dateType === 'expiry' ||
              c.dateType === 'best_before' ||
              c.dateType === 'use_by'
          ) || detectedCandidates[0];

        setSelectedCandidateId(primaryCand.id);
        setManualDate(primaryCand.normalizedDate);
        setManualDateType(primaryCand.dateType);
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setScanProgress(0);
      setScanError(err?.message || 'Network error while contacting OCR service.');
      setHasScannedOnce(true);
    } finally {
      setIsScanning(false);
    }
  };

  // Switch selected candidate
  const handleSelectCandidate = (candidate: DateCandidate) => {
    setSelectedCandidateId(candidate.id);
    setManualDate(candidate.normalizedDate);
    setManualDateType(candidate.dateType);
    setIsVerified(false);
  };

  // Candidate field updates
  const handleUpdateCandidateDate = (id: string, newDate: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const [y, m, d] = newDate.split('-').map(Number);
        const display = isValidCalendarDate(y, m, d) ? formatDisplayDate(y, m, d) : newDate;
        return { ...c, normalizedDate: newDate, displayDate: display };
      })
    );
    if (selectedCandidateId === id) {
      setManualDate(newDate);
      setIsVerified(false);
    }
  };

  const handleUpdateCandidateType = (id: string, newType: DateType) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, dateType: newType } : c))
    );
    if (selectedCandidateId === id) {
      setManualDateType(newType);
      setIsVerified(false);
    }
  };

  const handleDeleteCandidate = (id: string) => {
    setCandidates((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (selectedCandidateId === id) {
        if (remaining.length > 0) {
          setSelectedCandidateId(remaining[0].id);
          setManualDate(remaining[0].normalizedDate);
          setManualDateType(remaining[0].dateType);
        } else {
          setSelectedCandidateId(null);
        }
      }
      return remaining;
    });
    setIsVerified(false);
  };

  const handleAddManualCandidate = () => {
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    const newCand: DateCandidate = {
      id: `manual-${Date.now()}`,
      rawSnippet: 'Manual Entry',
      normalizedDate: defaultDate,
      displayDate: formatDisplayDate(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      ),
      dateType: 'expiry',
      confidence: 100,
      requiresManualConfirmation: true,
      ambiguityWarning: null,
      contextKeywords: ['MANUAL'],
    };

    setCandidates((prev) => [...prev, newCand]);
    setSelectedCandidateId(newCand.id);
    setManualDate(defaultDate);
    setManualDateType('expiry');
    setIsVerified(false);
  };

  // Copy raw OCR text to clipboard
  const handleCopyRawText = () => {
    if (!rawOcrText) return;
    navigator.clipboard.writeText(rawOcrText);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  // Real-time calculated urgency from current manual inputs
  const currentUrgency: UrgencyResult = calculateUrgency(manualDate, manualDateType);

  // Manual verification confirmation action
  const handleConfirmVerification = () => {
    if (!manualDate) {
      setScanError('Please enter or select a valid calendar date before confirming.');
      return;
    }

    const verifiedData: VerifiedFoodLabelData = {
      verifiedDate: manualDate,
      dateType: manualDateType,
      urgency: currentUrgency,
      allCandidates: candidates,
      rawText: rawOcrText,
      ocrConfidence: ocrConfidence,
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Kitchen Supervisor (Manual Verification)',
      isManuallyConfirmed: true,
      cloudinaryUrl: cloudinaryUrl || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
    };

    setIsVerified(true);
    setScanError(null);

    if (onVerificationComplete) {
      onVerificationComplete(verifiedData);
    }
  };

  return (
    <div className={`sl-verify-gateway ${className}`} aria-live="polite">
      {/* Header with Verification Status Pill */}
      <div className="sl-verify-gateway__header">
        <div className="sl-verify-gateway__title-group">
          <div className="sl-verify-gateway__title-row">
            <ShieldCheck size={20} className="sl-text-primary" />
            <h3 className="sl-verify-gateway__title">Food Label OCR &amp; Date Verification</h3>
          </div>
          <p className="sl-verify-gateway__subtitle">
            Extract printed packaging dates, review candidates, and manually verify before
            calculating urgency.
          </p>
        </div>

        <div className="sl-verify-gateway__status-pill-wrap">
          {isVerified ? (
            <span className="sl-badge sl-badge--success sl-badge--sm">
              <CheckCircle2 size={13} />
              <span>Verified by Human</span>
            </span>
          ) : (
            <span className="sl-badge sl-badge--warning sl-badge--sm">
              <Clock size={13} />
              <span>Verification Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="sl-verify-gateway__grid">
        {/* Left Column: Image & OCR Scanner Controls */}
        <div className="sl-verify-gateway__col-preview">
          <div className="sl-verify-preview-card">
            <div className="sl-verify-preview-card__img-container">
              {imagePreviewUrl || cloudinaryUrl ? (
                <img
                  src={imagePreviewUrl || cloudinaryUrl || ''}
                  alt="Packaging label under review"
                  className="sl-verify-preview-card__img"
                />
              ) : (
                <div className="sl-verify-preview-card__empty">
                  <Camera size={40} className="sl-text-muted" />
                  <span>No image selected</span>
                </div>
              )}

              {/* Bounding box visual indicator if OCR detected dates */}
              {candidates.length > 0 && (
                <div
                  className="sl-verify-preview-card__bbox-badge"
                  title="Dates detected by OCR in this label"
                >
                  <SparklesIcon size={13} />
                  <span>{candidates.length} date stamp{candidates.length > 1 ? 's' : ''} detected</span>
                </div>
              )}

              {/* Scanning Overlay */}
              {isScanning && (
                <div className="sl-verify-preview-card__scanning-overlay">
                  <RefreshCw size={28} className="sl-spin sl-text-primary" />
                  <span className="sl-verify-preview-card__scanning-text">
                    Scanning packaging text &amp; date stamps...
                  </span>
                  <div className="sl-verify-preview-card__progress-bar">
                    <div
                      className="sl-verify-preview-card__progress-fill"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Image Meta & Controls */}
            <div className="sl-verify-preview-card__footer">
              <div className="sl-verify-preview-card__meta">
                {imageFile && (
                  <span className="sl-verify-preview-card__filename" title={imageFile.name}>
                    {imageFile.name}
                  </span>
                )}
                {cloudinaryUrl && (
                  <span className="sl-badge sl-badge--success sl-badge--xs">
                    <CheckCircle2 size={11} />
                    <span>Cloudinary CDN</span>
                  </span>
                )}
              </div>

              <div className="sl-verify-preview-card__actions">
                {imageFile && (
                  <button
                    type="button"
                    className="sl-btn sl-btn--secondary sl-btn--sm"
                    onClick={() => runOcrScan(imageFile)}
                    disabled={isScanning}
                  >
                    <RefreshCw size={13} className={isScanning ? 'sl-spin' : ''} />
                    <span>{hasScannedOnce ? 'Re-scan OCR' : 'Scan Label'}</span>
                  </button>
                )}
                {onImageChangeRequest && (
                  <button
                    type="button"
                    className="sl-btn sl-btn--ghost sl-btn--sm"
                    onClick={onImageChangeRequest}
                    disabled={isScanning}
                  >
                    <span>Change Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OCR Engine Info Card */}
          <div className="sl-ocr-meta-card">
            <div className="sl-ocr-meta-card__row">
              <span className="sl-ocr-meta-card__label">OCR Engine:</span>
              <span className="sl-ocr-meta-card__val">Tesseract.js (Node.js In-Memory Worker)</span>
            </div>
            <div className="sl-ocr-meta-card__row">
              <span className="sl-ocr-meta-card__label">OCR Confidence:</span>
              <span className="sl-ocr-meta-card__val">
                {ocrConfidence > 0 ? (
                  <span
                    className={`sl-badge ${
                      ocrConfidence >= 85
                        ? 'sl-badge--success'
                        : ocrConfidence >= 60
                        ? 'sl-badge--warning'
                        : 'sl-badge--danger'
                    } sl-badge--xs`}
                  >
                    {ocrConfidence}%
                  </span>
                ) : (
                  'Not scanned yet'
                )}
              </span>
            </div>
            <div className="sl-ocr-meta-card__row">
              <span className="sl-ocr-meta-card__label">Raw Storage:</span>
              <span className="sl-ocr-meta-card__val">
                Zero disk storage (In-memory buffer)
              </span>
            </div>
          </div>

          {/* Collapsible Raw OCR Text Viewer */}
          {rawOcrText && (
            <div className="sl-raw-ocr-section">
              <button
                type="button"
                className="sl-raw-ocr-toggle"
                onClick={() => setShowRawText(!showRawText)}
                aria-expanded={showRawText}
              >
                <div className="sl-raw-ocr-toggle__left">
                  <FileText size={14} />
                  <span>Inspect Raw OCR Text ({rawOcrText.length} chars)</span>
                </div>
                {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showRawText && (
                <div className="sl-raw-ocr-panel">
                  <div className="sl-raw-ocr-panel__toolbar">
                    <span className="sl-raw-ocr-panel__hint">
                      Exact text output as parsed by OCR worker:
                    </span>
                    <button
                      type="button"
                      className="sl-btn sl-btn--ghost sl-btn--xs"
                      onClick={handleCopyRawText}
                    >
                      {copiedRawText ? (
                        <>
                          <Check size={12} className="sl-text-primary" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Raw Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="sl-raw-ocr-text">{rawOcrText}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Date Candidate Review & Urgency Gateway */}
        <div className="sl-verify-gateway__col-data">
          {/* Error Banner if OCR had an issue */}
          {scanError && (
            <div className="sl-verify-alert sl-verify-alert--warning" role="alert">
              <AlertTriangle size={18} className="sl-text-warning" />
              <div className="sl-verify-alert__content">
                <strong>OCR Scan Notice:</strong> {scanError}
                <div className="sl-verify-alert__sub">
                  A failed scan does not prevent you from entering or confirming dates manually.
                </div>
              </div>
            </div>
          )}

          {/* Section: Detected Date Candidates */}
          <div className="sl-candidate-section">
            <div className="sl-candidate-section__header">
              <div className="sl-candidate-section__heading-row">
                <Calendar size={16} className="sl-text-primary" />
                <h4 className="sl-candidate-section__title">
                  Detected Date Candidates ({candidates.length})
                </h4>
              </div>
              <button
                type="button"
                className="sl-btn sl-btn--secondary sl-btn--xs"
                onClick={handleAddManualCandidate}
              >
                <Plus size={13} />
                <span>Add Date Manually</span>
              </button>
            </div>

            {candidates.length === 0 ? (
              <div className="sl-candidate-empty">
                <AlertCircle size={28} className="sl-text-muted" />
                <p className="sl-candidate-empty__text">
                  {hasScannedOnce
                    ? 'No printed dates were automatically detected by the OCR engine.'
                    : 'Click "Scan Label" to detect packaging dates, or add a date manually.'}
                </p>
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary sl-btn--sm"
                  onClick={handleAddManualCandidate}
                >
                  <Plus size={14} />
                  <span>Enter Date Manually</span>
                </button>
              </div>
            ) : (
              <div className="sl-candidate-list" role="radiogroup" aria-label="Detected dates">
                {candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      className={`sl-candidate-card ${
                        isSelected ? 'sl-candidate-card--selected' : ''
                      }`}
                      onClick={() => handleSelectCandidate(cand)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <div className="sl-candidate-card__top">
                        <div className="sl-candidate-card__radio-col">
                          <input
                            type="radio"
                            name="selectedCandidate"
                            checked={isSelected}
                            onChange={() => handleSelectCandidate(cand)}
                            className="sl-radio"
                            aria-label={`Select date ${cand.displayDate}`}
                          />
                        </div>

                        <div className="sl-candidate-card__main-col">
                          <div className="sl-candidate-card__snippet-row">
                            <span className="sl-candidate-card__snippet-tag">OCR Snippet:</span>
                            <code className="sl-candidate-card__snippet-val">
                              "{cand.rawSnippet}"
                            </code>
                          </div>

                          <div className="sl-candidate-card__inputs-row" onClick={(e) => e.stopPropagation()}>
                            <div className="sl-candidate-card__input-group">
                              <label className="sl-label-xs">Calendar Date</label>
                              <input
                                type="date"
                                className="sl-input sl-input--sm"
                                value={cand.normalizedDate}
                                onChange={(e) =>
                                  handleUpdateCandidateDate(cand.id, e.target.value)
                                }
                              />
                            </div>

                            <div className="sl-candidate-card__input-group">
                              <label className="sl-label-xs">Date Classification</label>
                              <select
                                className="sl-input sl-input--sm"
                                value={cand.dateType}
                                onChange={(e) =>
                                  handleUpdateCandidateType(
                                    cand.id,
                                    e.target.value as DateType
                                  )
                                }
                              >
                                <option value="expiry">Expiry (EXP / EXPIRY)</option>
                                <option value="use_by">Use-By (USE BEFORE)</option>
                                <option value="best_before">Best Before (BBE / BB)</option>
                                <option value="manufacturing">Manufacturing (MFD / MFG)</option>
                                <option value="packaging">Packed On (PKD)</option>
                                <option value="unknown">Unconfirmed Type</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              className="sl-candidate-card__delete-btn"
                              title="Delete false detection"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCandidate(cand.id);
                              }}
                              aria-label="Remove date candidate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Ambiguity or Format Warning */}
                          {cand.ambiguityWarning && (
                            <div className="sl-candidate-card__warning">
                              <AlertTriangle size={13} className="sl-text-warning" />
                              <span>{cand.ambiguityWarning}</span>
                            </div>
                          )}

                          {/* Keyword / Confidence Tag */}
                          <div className="sl-candidate-card__tags">
                            <span
                              className={`sl-badge ${
                                cand.confidence >= 85
                                  ? 'sl-badge--success'
                                  : cand.confidence >= 60
                                  ? 'sl-badge--warning'
                                  : 'sl-badge--danger'
                              } sl-badge--xs`}
                            >
                              {cand.confidence}% match
                            </span>
                            {cand.contextKeywords.map((kw, i) => (
                              <span key={i} className="sl-badge sl-badge--neutral sl-badge--xs">
                                Key: {kw}
                              </span>
                            ))}
                            {cand.dateType === 'manufacturing' && (
                              <span className="sl-badge sl-badge--neutral sl-badge--xs">
                                ℹ Manufacturing date (Not used for expiry urgency)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Selected Applicable Date & Live Urgency Prioritization */}
          <div className="sl-urgency-preview-box">
            <div className="sl-urgency-preview-box__header">
              <span className="sl-urgency-preview-box__title">
                Urgency Calculation (Based on User-Confirmed Date)
              </span>
              <span className="sl-urgency-preview-box__mode">
                {isVerified ? 'Verified Active Calculation' : 'Live Preview (Pending Verification)'}
              </span>
            </div>

            <div className="sl-urgency-preview-box__content">
              <div className="sl-urgency-badge-row">
                <span
                  className={`sl-badge sl-badge--${currentUrgency.badgeVariant} sl-badge--md`}
                >
                  {currentUrgency.badgeVariant === 'danger' && <AlertTriangle size={16} />}
                  {currentUrgency.badgeVariant === 'warning' && <Clock size={16} />}
                  {currentUrgency.badgeVariant === 'success' && <CheckCircle2 size={16} />}
                  {currentUrgency.badgeVariant === 'neutral' && <PackageCheck size={16} />}
                  <span>{currentUrgency.statusLabel}</span>
                </span>

                {currentUrgency.daysRemaining !== null && (
                  <span className="sl-urgency-days-tag">
                    {currentUrgency.daysRemaining > 0
                      ? `${currentUrgency.daysRemaining} days remaining`
                      : currentUrgency.daysRemaining === 0
                      ? 'Due Today'
                      : `${Math.abs(currentUrgency.daysRemaining)} days past`}
                  </span>
                )}
              </div>

              <p className="sl-urgency-preview-box__message">{currentUrgency.message}</p>

              {/* Strict Rule Notice regarding Manufacturing Dates */}
              {(manualDateType === 'manufacturing' || manualDateType === 'packaging') && (
                <div className="sl-urgency-preview-box__rule-notice">
                  <AlertCircle size={15} />
                  <span>
                    <strong>Rule:</strong> Manufacturing and packing dates never drive expiry
                    urgency. Please select or add an expiry or best-before date for triage.
                  </span>
                </div>
              )}

              {/* Best Before Review Warning */}
              {manualDateType === 'best_before' &&
                currentUrgency.daysRemaining !== null &&
                currentUrgency.daysRemaining < 0 && (
                  <div className="sl-urgency-preview-box__rule-notice sl-urgency-preview-box__rule-notice--warning">
                    <ShieldAlert size={15} />
                    <span>
                      <strong>Best-Before Notice:</strong> This item has passed its optimal
                      freshness date. Under surplus food guidelines, dry goods may remain safe
                      following organoleptic inspection.
                    </span>
                  </div>
                )}
            </div>

            {/* Disclaimer */}
            <div className="sl-urgency-preview-box__disclaimer">
              <small>
                {currentUrgency.disclaimer} Urgency bands reflect collection timeline priority
                only and do not constitute an automated legal food-safety certification.
              </small>
            </div>
          </div>

          {/* Section: Human Verification Gateway Checkbox & Confirm Action */}
          <div className="sl-human-verify-gate">
            <div className="sl-human-verify-gate__checkbox-wrap">
              <label className="sl-checkbox-label">
                <input
                  type="checkbox"
                  className="sl-checkbox"
                  checked={isSupervisorChecked}
                  onChange={(e) => {
                    setIsSupervisorChecked(e.target.checked);
                    if (!e.target.checked) setIsVerified(false);
                  }}
                  id="human-verify-checkbox"
                />
                <span>
                  <strong>Supervisor Verification Sign-Off:</strong> I physically inspected the
                  packaging, checked all printed date stamps, and confirm that the selected date (
                  <code>{manualDate || 'No date'}</code>) and classification (
                  <code>{manualDateType.toUpperCase()}</code>) are verified.
                </span>
              </label>
            </div>

            <div className="sl-human-verify-gate__actions">
              <button
                type="button"
                className="sl-btn sl-btn--primary sl-btn--md sl-btn--full"
                onClick={handleConfirmVerification}
                disabled={!isSupervisorChecked || !manualDate || isScanning}
              >
                <CheckCircle2 size={16} />
                <span>
                  {isVerified ? '✓ Information Verified (Click to Re-Apply)' : 'Confirm & Apply Verified Date'}
                </span>
              </button>
            </div>

            {/* Application State Persistence Notice */}
            <div className="sl-human-verify-gate__persistence-notice">
              <small>
                ℹ Note: Verified dates and calculated urgency are preserved in application state
                for this listing session. SurplusLabel does not fabricate permanent database records
                without an active database backend.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Sparkles icon component
const SparklesIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default FoodLabelVerificationGateway;
