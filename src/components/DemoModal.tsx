import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sprout,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Package,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ClipboardCheck,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  Clock,
  PackageCheck,
} from 'lucide-react';
import { FoodLabelUploader, UploadResult } from './FoodLabelUploader';
import {
  DateType,
  calculateUrgency,
} from '../utils/ocrDateParser';
import { VerifiedFoodLabelData } from './FoodLabelVerificationGateway';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'donor' | 'recipient' | 'coordinator';
  initialDonorMode?: 'upload' | 'simulate';
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'donor',
  initialDonorMode = 'simulate',
}) => {
  const [role, setRole] = useState<'donor' | 'recipient' | 'coordinator'>(initialRole);
  const [donorMode, setDonorMode] = useState<'upload' | 'simulate'>(initialDonorMode);
  const [donorStep, setDonorStep] = useState<'verify' | 'submitted'>('verify');
  const [isScanning, setIsScanning] = useState(false);
  const [supervisorVerified, setSupervisorVerified] = useState(true);
  const [itemName, setItemName] = useState('Yippee Noodles Multipacks (20 packets)');
  const [extractedDate, setExtractedDate] = useState('2026-10-25');
  const [dateType, setDateType] = useState<DateType>('expiry');
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedFoodLabelData | null>(null);
  const [quantity, setQuantity] = useState('20 packets (1.4 kg)');
  const [storageType, setStorageType] = useState('Ambient / Cool & Dry Pantry');
  const [uploadedLabel, setUploadedLabel] = useState<UploadResult | null>(null);

  // Recipient Claim state
  const [claimedBatchId, setClaimedBatchId] = useState<string | null>(null);
  const [pickupPin, setPickupPin] = useState<string | null>(null);

  // Coordinator Approval state
  const [approvedBatches, setApprovedBatches] = useState<Record<string, boolean>>({});

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync role and donorMode if props change
  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  useEffect(() => {
    if (initialDonorMode) setDonorMode(initialDonorMode);
  }, [initialDonorMode]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLButtonElement>('.sl-modal__close');
      closeBtn?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const simulateScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/sample-food-label-crisp.jpg');
      const blob = await res.blob();
      const form = new FormData();
      form.append('image', blob, 'sample-food-label-crisp.jpg');

      const ocrRes = await fetch('/api/ocr/food-label', {
        method: 'POST',
        body: form,
      });
      const data = await ocrRes.json();
      if (data.success && data.data.candidates && data.data.candidates.length > 0) {
        const expCand =
          data.data.candidates.find((c: any) => c.dateType === 'expiry') ||
          data.data.candidates[0];
        setExtractedDate(expCand.normalizedDate);
        setDateType(expCand.dateType);
        setItemName('Organic Whole Oats (500g)');
        setQuantity('24 cartons (12 kg)');
      } else {
        setExtractedDate('2026-11-28');
        setDateType('expiry');
      }
    } catch (e) {
      console.warn('Preset scan fallback:', e);
      setExtractedDate('2026-11-28');
      setDateType('expiry');
    } finally {
      setIsScanning(false);
      setDonorStep('verify');
    }
  };

  const handleClaim = (batchId: string) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setClaimedBatchId(batchId);
    setPickupPin(randomPin);
  };

  const handleApprove = (batchId: string) => {
    setApprovedBatches((prev) => ({ ...prev, [batchId]: true }));
  };

  const dynamicUrgency = calculateUrgency(extractedDate, dateType);

  return (
    <div
      className="sl-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="sl-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="sl-modal__header">
          <div className="sl-modal__title-group">
            <div className="sl-brand__icon-box">
              <Sprout size={20} className="sl-text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-title" className="sl-modal__title">
                SurplusLabel Prototype Walkthrough
              </h2>
              <span className="sl-modal__subtitle">
                Interactive Exhibition Mode • 3 Stakeholder Roles
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sl-modal__close"
            onClick={onClose}
            aria-label="Close Walkthrough Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Role Switcher Tabs (Donor, Recipient, Coordinator) */}
        <div className="sl-modal__tabs" role="tablist" aria-label="Walkthrough Roles">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'donor'}
            className={`sl-modal-tab ${role === 'donor' ? 'sl-modal-tab--active' : ''}`}
            onClick={() => {
              setRole('donor');
              setClaimedBatchId(null);
            }}
          >
            <Package size={15} aria-hidden="true" />
            <span>1. Donor Quick-Log</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'recipient'}
            className={`sl-modal-tab ${role === 'recipient' ? 'sl-modal-tab--active' : ''}`}
            onClick={() => {
              setRole('recipient');
              setClaimedBatchId(null);
            }}
          >
            <Truck size={15} aria-hidden="true" />
            <span>2. Recipient Triage</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'coordinator'}
            className={`sl-modal-tab ${role === 'coordinator' ? 'sl-modal-tab--active' : ''}`}
            onClick={() => {
              setRole('coordinator');
              setClaimedBatchId(null);
            }}
          >
            <ClipboardCheck size={15} aria-hidden="true" />
            <span>3. Coordinator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="sl-modal__body">
          {/* ROLE 1: DONOR WORKFLOW */}
          {role === 'donor' && (
            <div className="sl-demo-donor">
              {donorStep === 'verify' && (
                <>
                  {/* Mode Selector: Live Cloudinary Upload vs Preset Pack Demo */}
                  <div className="sl-donor-mode-selector" role="tablist" aria-label="Label Intake Method">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={donorMode === 'upload'}
                      className={`sl-donor-mode-btn ${donorMode === 'upload' ? 'sl-donor-mode-btn--active' : ''}`}
                      onClick={() => setDonorMode('upload')}
                    >
                      <UploadCloud size={15} />
                      <span>Upload Label Photo (Cloudinary)</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={donorMode === 'simulate'}
                      className={`sl-donor-mode-btn ${donorMode === 'simulate' ? 'sl-donor-mode-btn--active' : ''}`}
                      onClick={() => setDonorMode('simulate')}
                    >
                      <Camera size={15} />
                      <span>Preset Packaging Demo</span>
                    </button>
                  </div>

                  {donorMode === 'upload' ? (
                    <div className="sl-donor-uploader-wrapper">
                      <div className="sl-demo-banner">
                        <UploadCloud size={16} className="sl-text-primary" />
                        <span>
                          Upload a food packaging label to stream directly to <strong>Cloudinary CDN</strong>.
                        </span>
                      </div>
                      <FoodLabelUploader
                        onUploadSuccess={(result) => {
                          setUploadedLabel(result);
                          if (result.original_filename) {
                            const cleanName = result.original_filename
                              .replace(/[-_]/g, ' ')
                              .replace(/\.[^/.]+$/, '')
                              .replace(/\b\w/g, (c) => c.toUpperCase());
                            setItemName(cleanName || 'Packaged Food Batch');
                          }
                        }}
                        onVerificationComplete={(data) => {
                          setExtractedDate(data.verifiedDate);
                          setDateType(data.dateType);
                          setSupervisorVerified(true);
                          setVerifiedInfo(data);
                        }}
                        onRemove={() => {
                          setUploadedLabel(null);
                          setVerifiedInfo(null);
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="sl-demo-banner">
                        <Sparkles size={16} className="sl-text-primary" />
                        <span>
                          Simulating OCR packaging scan for <strong>ABC Hostel Mess (Sector 62, Noida)</strong>.
                        </span>
                      </div>

                      {/* OCR Visual Card */}
                      <div className="sl-modal-ocr-card">
                        <div className="sl-modal-ocr-card__scan-area">
                          {isScanning ? (
                            <div className="sl-modal-ocr-card__scanning">
                              <RefreshCw size={24} className="sl-spin sl-text-primary" />
                              <span>Scanning packaging typography &amp; printed expiry stamp...</span>
                            </div>
                          ) : (
                            <>
                              <div className="sl-modal-ocr-card__pack-preview">
                                <span className="sl-modal-ocr-card__pack-title">Yippee! Noodles Multipack (20 pkts)</span>
                                <span className="sl-modal-ocr-card__pack-batch">LOT #2026-X8 • ABC Hostel Mess</span>
                              </div>

                              <div className="sl-modal-ocr-card__bbox">
                                <span className="sl-modal-ocr-card__bbox-tag">Detected Printed Code</span>
                                <code className="sl-modal-ocr-card__bbox-code">EXP: 25 OCT 2026</code>
                              </div>
                              <div className="sl-modal-ocr-card__meta-tag">
                                <span className="sl-badge sl-badge--success sl-badge--xs">
                                  <CheckCircle2 size={12} />
                                  <span>96% OCR Confidence</span>
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          className="sl-btn sl-btn--secondary sl-btn--sm sl-modal-ocr-card__rescan"
                          onClick={simulateScan}
                          disabled={isScanning}
                        >
                          <Camera size={14} />
                          <span>Re-simulate Photo Scan</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Verification Form matching Add Food Listing screen */}
                  <form
                    className="sl-modal-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDonorStep('submitted');
                    }}
                  >
                    <div className="sl-form-group">
                      <label htmlFor="item-name" className="sl-label">
                        Food Item Name
                      </label>
                      <input
                        id="item-name"
                        type="text"
                        className="sl-input"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="sl-form-row">
                      <div className="sl-form-group">
                        <label htmlFor="extracted-date" className="sl-label">
                          Verified Calendar Date
                        </label>
                        <input
                          id="extracted-date"
                          type="date"
                          className="sl-input"
                          value={extractedDate}
                          onChange={(e) => setExtractedDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="sl-form-group">
                        <label htmlFor="date-type-select" className="sl-label">
                          Date Classification
                        </label>
                        <select
                          id="date-type-select"
                          className="sl-input"
                          value={dateType}
                          onChange={(e) => setDateType(e.target.value as DateType)}
                        >
                          <option value="expiry">Expiry (EXP / EXPIRY)</option>
                          <option value="use_by">Use-By (USE BEFORE)</option>
                          <option value="best_before">Best Before (BBE / BB)</option>
                          <option value="manufacturing">Manufacturing (MFD / MFG)</option>
                          <option value="packaging">Packed On (PKD)</option>
                        </select>
                      </div>
                    </div>

                    <div className="sl-form-group">
                      <label className="sl-label">Calculated Operational Urgency</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '6px 0' }}>
                        <span className={`sl-badge sl-badge--${dynamicUrgency.badgeVariant} sl-badge--sm`}>
                          {dynamicUrgency.badgeVariant === 'danger' && <AlertTriangle size={12} />}
                          {dynamicUrgency.badgeVariant === 'warning' && <Clock size={12} />}
                          {dynamicUrgency.badgeVariant === 'success' && <CheckCircle2 size={12} />}
                          {dynamicUrgency.badgeVariant === 'neutral' && <PackageCheck size={12} />}
                          <span>{dynamicUrgency.statusLabel}</span>
                        </span>
                        {dynamicUrgency.daysRemaining !== null && (
                          <span className="sl-text-xs sl-text-muted" style={{ fontWeight: 600 }}>
                            {dynamicUrgency.daysRemaining > 0
                              ? `(${dynamicUrgency.daysRemaining} days remaining)`
                              : dynamicUrgency.daysRemaining === 0
                              ? '(Due Today)'
                              : `(${Math.abs(dynamicUrgency.daysRemaining)} days past)`}
                          </span>
                        )}
                      </div>
                      {(dateType === 'manufacturing' || dateType === 'packaging') && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--sl-color-warning-800)', marginTop: '2px' }}>
                          ℹ Manufacturing dates are production records and cannot drive expiry urgency.
                        </div>
                      )}
                    </div>

                    <div className="sl-form-row">
                      <div className="sl-form-group">
                        <label htmlFor="item-qty" className="sl-label">
                          Quantity
                        </label>
                        <input
                          id="item-qty"
                          type="text"
                          className="sl-input"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                        />
                      </div>

                      <div className="sl-form-group">
                        <label htmlFor="storage-req" className="sl-label">
                          Storage Conditions
                        </label>
                        <select
                          id="storage-req"
                          className="sl-input"
                          value={storageType}
                          onChange={(e) => setStorageType(e.target.value)}
                        >
                          <option>Ambient / Cool &amp; Dry Pantry</option>
                          <option>Chilled (&lt; 4°C)</option>
                          <option>Frozen (&lt; -18°C)</option>
                          <option>Sealed Cartons (Room Temp)</option>
                        </select>
                      </div>
                    </div>

                    {/* Attached Cloudinary Asset Banner */}
                    {uploadedLabel && (
                      <div className="sl-attached-asset-banner">
                        <div className="sl-attached-asset-banner__thumb-wrap">
                          <img
                            src={uploadedLabel.url}
                            alt="Packaging label thumbnail"
                            className="sl-attached-asset-banner__thumb"
                          />
                        </div>
                        <div className="sl-attached-asset-banner__content">
                          <div className="sl-attached-asset-banner__header">
                            <span className="sl-badge sl-badge--success sl-badge--xs">
                              <CheckCircle2 size={12} />
                              <span>Cloudinary CDN Synced</span>
                            </span>
                            <span className="sl-attached-asset-banner__format">
                              {uploadedLabel.format.toUpperCase()} • {uploadedLabel.width}×{uploadedLabel.height}px • {(uploadedLabel.bytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <div className="sl-attached-asset-banner__id">
                            <code className="sl-code-xs">{uploadedLabel.public_id}</code>
                          </div>
                        </div>
                        <a
                          href={uploadedLabel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sl-attached-asset-banner__link"
                          title="Open image on Cloudinary CDN"
                        >
                          <span>View CDN</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}

                    {/* Supervisor Verification Checkbox */}
                    <div className="sl-form-checkbox-group">
                      <label className="sl-checkbox-label">
                        <input
                          type="checkbox"
                          className="sl-checkbox"
                          checked={supervisorVerified}
                          onChange={(e) => setSupervisorVerified(e.target.checked)}
                          required
                        />
                        <span>
                          <strong>Supervisor Verification:</strong> I physically inspected the packaging seals
                          and confirm the printed expiration date matches the OCR extraction.
                        </span>
                      </label>
                    </div>

                    <div className="sl-modal__footer-actions">
                      <button
                        type="button"
                        className="sl-btn sl-btn--secondary sl-btn--md"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="sl-btn sl-btn--primary sl-btn--md"
                        disabled={!supervisorVerified}
                      >
                        <span>Publish Food Listing</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {donorStep === 'submitted' && (
                <div className="sl-demo-success">
                  <div className="sl-demo-success__icon">
                    <CheckCircle2 size={48} className="sl-text-primary" />
                  </div>
                  <h3 className="sl-demo-success__title">Listing Published to Food Bank Network</h3>
                  <p className="sl-demo-success__desc">
                    Batch <strong>#SL-8842</strong> is now live on the priority feed. Nearby pantries and community kitchens
                    have received an urgency notification.
                  </p>

                  <div className="sl-demo-success__card">
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Batch ID:</span>
                      <strong>#SL-8842</strong>
                    </div>
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Item:</span>
                      <span>{itemName}</span>
                    </div>
                    {uploadedLabel && (
                      <div className="sl-demo-success__row sl-demo-success__row--photo">
                        <span className="sl-text-muted">Attached Photo:</span>
                        <div className="sl-demo-success__photo-card">
                          <img
                            src={uploadedLabel.url}
                            alt={itemName}
                            className="sl-demo-success__photo-thumb"
                          />
                          <div className="sl-demo-success__photo-info">
                            <span className="sl-badge sl-badge--success sl-badge--xs">
                              <CheckCircle2 size={11} />
                              <span>Cloudinary CDN Active</span>
                            </span>
                            <code className="sl-code-xs">{uploadedLabel.public_id}</code>
                            <a
                              href={uploadedLabel.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sl-link-external sl-text-xs"
                            >
                              <span>Open CDN Image</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Verified Date:</span>
                      <strong>
                        {extractedDate} ({dateType.toUpperCase()})
                      </strong>
                    </div>
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Calculated Urgency:</span>
                      <span className={`sl-badge sl-badge--${dynamicUrgency.badgeVariant} sl-badge--xs`}>
                        {dynamicUrgency.statusLabel}
                      </span>
                    </div>
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Status:</span>
                      <span className="sl-badge sl-badge--primary sl-badge--xs">Awaiting Pickup Claim</span>
                    </div>
                    <div className="sl-demo-success__row">
                      <span className="sl-text-muted">Safety Sign-off:</span>
                      <span className="sl-text-primary">
                        ✓ Verified by Kitchen Supervisor (Manual Sign-Off)
                      </span>
                    </div>
                    {verifiedInfo && (
                      <div className="sl-demo-success__row">
                        <span className="sl-text-muted">OCR Diagnostics:</span>
                        <span className="sl-badge sl-badge--neutral sl-badge--xs">
                          Engine Match: {verifiedInfo.ocrConfidence}% ({verifiedInfo.allCandidates.length} candidate date stamps)
                        </span>
                      </div>
                    )}
                    <div className="sl-demo-success__row" style={{ borderTop: '1px dashed var(--sl-color-border-subtle)', paddingTop: '8px' }}>
                      <span className="sl-text-muted" style={{ fontSize: '0.6875rem' }}>Persistence:</span>
                      <span className="sl-text-muted" style={{ fontSize: '0.6875rem', fontStyle: 'italic' }}>
                        Session Application State (No database record created)
                      </span>
                    </div>
                  </div>

                  <div className="sl-modal__footer-actions">
                    <button
                      type="button"
                      className="sl-btn sl-btn--secondary sl-btn--md"
                      onClick={() => setDonorStep('verify')}
                    >
                      Log Another Item
                    </button>
                    <button
                      type="button"
                      className="sl-btn sl-btn--primary sl-btn--md"
                      onClick={() => {
                        setRole('recipient');
                        setDonorStep('verify');
                      }}
                    >
                      <span>Switch to Food Bank View</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROLE 2: RECIPIENT WORKFLOW */}
          {role === 'recipient' && (
            <div className="sl-demo-recipient">
              <div className="sl-demo-banner">
                <Truck size={16} className="sl-text-secondary" />
                <span>
                  Viewing active surplus batches within 5 km of <strong>Community Kitchen Hub #4</strong>.
                </span>
              </div>

              {claimedBatchId && pickupPin ? (
                /* Claim Confirmation Box */
                <div className="sl-demo-claimed-box">
                  <div className="sl-demo-claimed-box__header">
                    <CheckCircle2 size={24} className="sl-text-primary" />
                    <div>
                      <h4 className="sl-demo-claimed-box__title">Batch Successfully Reserved!</h4>
                      <p className="sl-demo-claimed-box__sub">
                        Batch <strong>{claimedBatchId}</strong> has been allocated to your organization.
                      </p>
                    </div>
                  </div>

                  <div className="sl-pin-display">
                    <span className="sl-pin-display__label">Present this Handover PIN to the Donor:</span>
                    <div className="sl-pin-display__code tabular-nums">{pickupPin}</div>
                    <span className="sl-pin-display__hint">
                      Donor will enter this PIN code to verify authorized transfer and log completion.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="sl-btn sl-btn--secondary sl-btn--sm"
                    onClick={() => {
                      setClaimedBatchId(null);
                      setPickupPin(null);
                    }}
                  >
                    Back to Feed
                  </button>
                </div>
              ) : null}

              {/* Feed of active items matching screenshots 5 and 6 */}
              <div className="sl-recipient-demo-list">
                {/* Item 1: Yippee */}
                <div className="sl-recipient-demo-card sl-recipient-demo-card--urgent">
                  <div className="sl-recipient-demo-card__header">
                    <div>
                      <div className="sl-recipient-demo-card__tags">
                        <span className="sl-badge sl-badge--danger sl-badge--xs">
                          <AlertTriangle size={12} />
                          <span>Urgent (&lt; 4h)</span>
                        </span>
                        <span className="sl-badge sl-badge--secondary sl-badge--xs">
                          ABC Hostel Mess (Sec 62)
                        </span>
                        <span className="sl-badge sl-badge--success sl-badge--xs">
                          <CheckCircle2 size={12} />
                          <span>OCR Date Verified</span>
                        </span>
                      </div>
                      <h4 className="sl-recipient-demo-card__title">
                        Yippee Noodles (20 packets)
                      </h4>
                    </div>
                  </div>

                  <div className="sl-recipient-demo-card__meta">
                    <span>Expiry: 25 Oct 2026 • Ambient Storage</span>
                    <span>•</span>
                    <span>1.2 km away (Pickup window: Today 14:00 - 16:30)</span>
                  </div>

                  <div className="sl-recipient-demo-card__actions">
                    <button
                      type="button"
                      className="sl-btn sl-btn--primary sl-btn--sm"
                      onClick={() => handleClaim('#SL-8842')}
                      disabled={claimedBatchId === '#SL-8842'}
                    >
                      {claimedBatchId === '#SL-8842' ? 'Reserved' : 'Claim Batch for Pickup'}
                    </button>
                  </div>
                </div>

                {/* Item 2: Parle-G */}
                <div className="sl-recipient-demo-card">
                  <div className="sl-recipient-demo-card__header">
                    <div>
                      <div className="sl-recipient-demo-card__tags">
                        <span className="sl-badge sl-badge--success sl-badge--xs">Available</span>
                        <span className="sl-badge sl-badge--secondary sl-badge--xs">XYZ Store</span>
                        <span className="sl-badge sl-badge--success sl-badge--xs">
                          <CheckCircle2 size={12} />
                          <span>OCR Date Verified</span>
                        </span>
                      </div>
                      <h4 className="sl-recipient-demo-card__title">
                        Parle-G Biscuits (20 packets)
                      </h4>
                    </div>
                  </div>

                  <div className="sl-recipient-demo-card__meta">
                    <span>Expiry: 28 Oct 2026 • Ambient Storage</span>
                    <span>•</span>
                    <span>2.1 km away (Pickup window: Today 17:00 - 20:00)</span>
                  </div>

                  <div className="sl-recipient-demo-card__actions">
                    <button
                      type="button"
                      className="sl-btn sl-btn--secondary sl-btn--sm"
                      onClick={() => handleClaim('#SL-8845')}
                      disabled={claimedBatchId === '#SL-8845'}
                    >
                      {claimedBatchId === '#SL-8845' ? 'Reserved' : 'Claim Batch for Pickup'}
                    </button>
                  </div>
                </div>

                {/* Item 3: Amul Milk */}
                <div className="sl-recipient-demo-card">
                  <div className="sl-recipient-demo-card__header">
                    <div>
                      <div className="sl-recipient-demo-card__tags">
                        <span className="sl-badge sl-badge--success sl-badge--xs">Available</span>
                        <span className="sl-badge sl-badge--secondary sl-badge--xs">PQR Event Hall</span>
                        <span className="sl-badge sl-badge--success sl-badge--xs">
                          <CheckCircle2 size={12} />
                          <span>OCR Date Verified</span>
                        </span>
                      </div>
                      <h4 className="sl-recipient-demo-card__title">
                        Amul Milk Tetra Packs (10 packs)
                      </h4>
                    </div>
                  </div>

                  <div className="sl-recipient-demo-card__meta">
                    <span>Expiry: 22 Oct 2026 • Chilled Storage (&lt;4°C)</span>
                    <span>•</span>
                    <span>3.4 km away (Pickup window: Today 18:00 - 21:00)</span>
                  </div>

                  <div className="sl-recipient-demo-card__actions">
                    <button
                      type="button"
                      className="sl-btn sl-btn--secondary sl-btn--sm"
                      onClick={() => handleClaim('#SL-8849')}
                      disabled={claimedBatchId === '#SL-8849'}
                    >
                      {claimedBatchId === '#SL-8849' ? 'Reserved' : 'Claim Batch for Pickup'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="sl-modal__footer-actions">
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary sl-btn--md"
                  onClick={onClose}
                >
                  Close Walkthrough
                </button>
              </div>
            </div>
          )}

          {/* ROLE 3: COORDINATOR WORKFLOW matching Screen 8 */}
          {role === 'coordinator' && (
            <div className="sl-demo-coordinator">
              <div className="sl-demo-banner">
                <ShieldCheck size={16} className="sl-text-primary" />
                <span>
                  Coordinator Audit Dashboard: Review listings, verify safety details, and manage pickups.
                </span>
              </div>

              <div className="sl-coordinator-stat-row">
                <div className="sl-coordinator-stat">
                  <span className="sl-coordinator-stat__num">18</span>
                  <span className="sl-coordinator-stat__lbl">Total Listings</span>
                </div>
                <div className="sl-coordinator-stat">
                  <span className="sl-coordinator-stat__num sl-text-primary">7</span>
                  <span className="sl-coordinator-stat__lbl">Pending Review</span>
                </div>
                <div className="sl-coordinator-stat">
                  <span className="sl-coordinator-stat__num">5</span>
                  <span className="sl-coordinator-stat__lbl">Pickup Scheduled</span>
                </div>
                <div className="sl-coordinator-stat">
                  <span className="sl-coordinator-stat__num">6</span>
                  <span className="sl-coordinator-stat__lbl">Completed</span>
                </div>
              </div>

              {/* Coordinator review items */}
              <div className="sl-coordinator-table-card">
                <div className="sl-coordinator-table-card__header">
                  <strong>Pending Verification Queue</strong>
                  <span className="sl-text-xs sl-text-muted">Supervisor signatures awaiting sign-off</span>
                </div>

                <div className="sl-coordinator-rows">
                  {/* Row 1 */}
                  <div className="sl-coordinator-row">
                    <div className="sl-coordinator-row__main">
                      <div className="sl-coordinator-row__title">
                        <strong>Yippee Noodles (20 pkts)</strong>
                        <span className="sl-badge sl-badge--warning sl-badge--xs">Pending Review</span>
                      </div>
                      <div className="sl-coordinator-row__meta">
                        <span>ABC Hostel Mess • Expiry: 25 Oct 2026 • 96% Match</span>
                      </div>
                    </div>
                    <div>
                      {approvedBatches['#SL-8842'] ? (
                        <span className="sl-badge sl-badge--success sl-badge--sm">✓ Approved</span>
                      ) : (
                        <button
                          type="button"
                          className="sl-btn sl-btn--primary sl-btn--sm"
                          onClick={() => handleApprove('#SL-8842')}
                        >
                          Review &amp; Approve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="sl-coordinator-row">
                    <div className="sl-coordinator-row__main">
                      <div className="sl-coordinator-row__title">
                        <strong>Britannia Biscuits (15 pkts)</strong>
                        <span className="sl-badge sl-badge--secondary sl-badge--xs">In Review</span>
                      </div>
                      <div className="sl-coordinator-row__meta">
                        <span>XYZ Store • Expiry: 28 Oct 2026 • 91% Match</span>
                      </div>
                    </div>
                    <div>
                      {approvedBatches['#SL-8843'] ? (
                        <span className="sl-badge sl-badge--success sl-badge--sm">✓ Approved</span>
                      ) : (
                        <button
                          type="button"
                          className="sl-btn sl-btn--primary sl-btn--sm"
                          onClick={() => handleApprove('#SL-8843')}
                        >
                          Review &amp; Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sl-modal__footer-actions">
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary sl-btn--md"
                  onClick={onClose}
                >
                  Close Walkthrough
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
