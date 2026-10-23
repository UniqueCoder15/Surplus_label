import React, { useState, useEffect } from 'react';
import {
  X,
  PackagePlus,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
} from 'lucide-react';
import {
  DateType,
  UrgencyResult,
  calculateUrgency,
  isValidCalendarDate,
} from '../utils/ocrDateParser';
import { FoodCategory, StorageCondition, FoodListing } from '../types/inventory';
import { FoodLabelUploader, UploadResult } from './FoodLabelUploader';
import { VerifiedFoodLabelData } from './FoodLabelVerificationGateway';
import { useAuth } from '../context/AuthContext';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onListingCreated: (newListing: FoodListing) => void;
}

export const CreateListingModal: React.FC<CreateListingModalProps> = ({
  isOpen,
  onClose,
  onListingCreated,
}) => {
  const { user, authFetch } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('pantry_grains');
  const [quantity, setQuantity] = useState<number | ''>(25);
  const [unit, setUnit] = useState('packs');
  const [storageCondition, setStorageCondition] = useState<StorageCondition>('ambient');
  const [handlingNotes, setHandlingNotes] = useState('');
  const [donorOrg, setDonorOrg] = useState(user?.organizationName || 'Campus Central Kitchen #2');
  const [pickupLocation, setPickupLocation] = useState(user?.address || 'Kitchen Loading Bay 2, South Wing');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+1 (555) 321-7654');

  // Image & Cloudinary
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imagePublicId, setImagePublicId] = useState<string | undefined>(undefined);

  // Date & OCR verification state
  const [relevantDate, setRelevantDate] = useState<string>('');
  const [dateType, setDateType] = useState<DateType>('best_before');
  const [isManuallyConfirmed, setIsManuallyConfirmed] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState(
    user ? `${user.contactName} (${user.role === 'admin' ? 'Admin' : 'Donor Supervisor'})` : 'Supervisor Elena Rostova'
  );
  const [rawOcrText, setRawOcrText] = useState<string | undefined>(undefined);
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>(undefined);

  // Prefill when user changes
  useEffect(() => {
    if (user && isOpen) {
      setDonorOrg(user.organizationName);
      if (user.phone) setContactPhone(user.phone);
      if (user.address) setPickupLocation(user.address);
      setVerifiedBy(`${user.contactName} (${user.role === 'admin' ? 'Admin' : 'Donor Supervisor'})`);
    }
  }, [user, isOpen]);

  // Live urgency preview calculation
  const [urgencyPreview, setUrgencyPreview] = useState<UrgencyResult | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'details' | 'packaging'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate live urgency preview whenever relevantDate or dateType changes
  useEffect(() => {
    if (relevantDate) {
      const result = calculateUrgency(relevantDate, dateType, new Date());
      setUrgencyPreview(result);
    } else {
      setUrgencyPreview(null);
    }
  }, [relevantDate, dateType]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset or preset values on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      // Pre-fill a realistic date ~14 days ahead if not set
      if (!relevantDate) {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setRelevantDate(`${yyyy}-${mm}-${dd}`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle verification from FoodLabelUploader / Gateway
  const handleVerificationComplete = (data: VerifiedFoodLabelData) => {
    setRelevantDate(data.verifiedDate);
    setDateType(data.dateType);
    setIsManuallyConfirmed(true);
    setVerifiedBy(data.verifiedBy || 'Supervisor Elena Rostova');
    setRawOcrText(data.rawText);
    setOcrConfidence(data.ocrConfidence);
    if (data.cloudinaryUrl) {
      setImageUrl(data.cloudinaryUrl);
    }
    if (data.cloudinaryPublicId) {
      setImagePublicId(data.cloudinaryPublicId);
    }
    setActiveTab('details'); // Switch back to details with pre-filled verified date
  };

  const handleUploadSuccess = (upload: UploadResult) => {
    setImageUrl(upload.url);
    setImagePublicId(upload.public_id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('Please provide a food item title.');
      return;
    }
    if (quantity === '' || Number(quantity) <= 0) {
      setErrorMessage('Quantity must be a positive number greater than 0.');
      return;
    }
    if (!unit.trim()) {
      setErrorMessage('Unit of measurement is required.');
      return;
    }
    if (!donorOrg.trim()) {
      setErrorMessage('Donor organization name is required.');
      return;
    }
    if (!pickupLocation.trim()) {
      setErrorMessage('Pickup location address is required.');
      return;
    }
    if (!relevantDate) {
      setErrorMessage('Packaging date is required.');
      return;
    }

    // Calendar validation
    const dateParts = relevantDate.split('-');
    if (dateParts.length !== 3) {
      setErrorMessage('Date must be in format YYYY-MM-DD.');
      return;
    }
    const [y, m, d] = dateParts.map(Number);
    if (!isValidCalendarDate(y, m, d)) {
      setErrorMessage(`"${relevantDate}" is an invalid calendar date. Please enter a valid date.`);
      return;
    }

    // STRICT HUMAN CONFIRMATION REQUIREMENT
    if (!isManuallyConfirmed) {
      setErrorMessage(
        'Human supervisor verification sign-off is mandatory. Food listings cannot be published from unconfirmed OCR output.'
      );
      return;
    }

    if (!verifiedBy.trim()) {
      setErrorMessage('Verifier name / supervisor signature is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          quantity: Number(quantity),
          unit: unit.trim(),
          storageCondition,
          handlingNotes: handlingNotes.trim() || undefined,
          donorOrg: donorOrg.trim(),
          pickupLocation: pickupLocation.trim(),
          contactPhone: contactPhone.trim() || undefined,
          imageUrl: imageUrl || undefined,
          imagePublicId: imagePublicId || undefined,
          relevantDate: relevantDate.trim(),
          dateType,
          isManuallyConfirmed: true,
          verifiedBy: verifiedBy.trim(),
          rawOcrText: rawOcrText || undefined,
          ocrConfidence: ocrConfidence || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create food listing.');
      }

      onListingCreated(data.data);
      onClose();
    } catch (err: any) {
      console.error('Error creating food listing:', err);
      setErrorMessage(err.message || 'Network error while publishing listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="sl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-listing-title"
    >
      <div className="sl-modal-container sl-modal-container--create">
        {/* Header */}
        <div className="sl-modal-header">
          <div className="sl-modal-header__title-box">
            <span className="sl-modal-header__icon-box">
              <PackagePlus size={20} className="sl-text-primary" />
            </span>
            <div>
              <h2 id="create-listing-title" className="sl-modal-title">
                Log New Surplus Food Listing
              </h2>
              <p className="sl-modal-subtitle">
                Enter batch specifications and verify packaging date before publishing to community
                charities.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sl-btn sl-btn--icon sl-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle: Listing Details vs OCR Label Scanning */}
        <div className="sl-modal-tabs">
          <button
            type="button"
            className={`sl-modal-tab ${activeTab === 'details' ? 'sl-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <span>1. Batch & Date Details</span>
          </button>
          <button
            type="button"
            className={`sl-modal-tab ${activeTab === 'packaging' ? 'sl-modal-tab--active' : ''}`}
            onClick={() => setActiveTab('packaging')}
          >
            <Camera size={14} />
            <span>2. Label Photo & OCR Scan {isManuallyConfirmed && '✓'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="sl-modal-body">
          {errorMessage && (
            <div className="sl-error-banner" role="alert">
              <AlertTriangle size={18} className="sl-text-danger sl-flex-shrink-0" />
              <p className="sl-error-banner__message">{errorMessage}</p>
            </div>
          )}

          {activeTab === 'packaging' ? (
            /* OCR Verification & Packaging Image Tab */
            <div className="sl-ocr-embed-container">
              <div className="sl-ocr-embed-intro">
                <Sparkles size={16} className="sl-text-primary" />
                <span>
                  Upload a photo of the food packaging label or try our sample label to extract
                  printed dates using Tesseract.js OCR.
                </span>
              </div>

              <FoodLabelUploader
                onUploadSuccess={handleUploadSuccess}
                onVerificationComplete={handleVerificationComplete}
                enableOcrVerification={true}
              />

              <div className="sl-modal-footer sl-mt-4">
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary"
                  onClick={() => setActiveTab('details')}
                >
                  Return to Listing Form
                </button>
              </div>
            </div>
          ) : (
            /* Main Listing Details Form */
            <form onSubmit={handleSubmit} className="sl-create-form">
              {/* Product Title */}
              <div className="sl-form-group">
                <label htmlFor="create-title" className="sl-form-label">
                  Food Product Name <span className="sl-required">*</span>
                </label>
                <input
                  id="create-title"
                  type="text"
                  className="sl-form-input"
                  placeholder="e.g. Organic Rolled Oats 1kg or Whole Wheat Loaves"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Category & Storage Condition */}
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label htmlFor="create-category" className="sl-form-label">
                    Category <span className="sl-required">*</span>
                  </label>
                  <select
                    id="create-category"
                    className="sl-form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FoodCategory)}
                    required
                  >
                    <option value="pantry_grains">Pantry & Dry Grains</option>
                    <option value="bakery">Bakery & Bread</option>
                    <option value="dairy">Dairy & Eggs</option>
                    <option value="produce">Fresh Produce / Fruits / Veg</option>
                    <option value="canned_packaged">Canned & Preserved</option>
                    <option value="prepared_meals">Prepared Meals & Catering</option>
                    <option value="beverages">Beverages & Juices</option>
                    <option value="other">Other Packaged Food</option>
                  </select>
                </div>

                <div className="sl-form-group">
                  <label htmlFor="create-storage" className="sl-form-label">
                    Storage Requirement <span className="sl-required">*</span>
                  </label>
                  <select
                    id="create-storage"
                    className="sl-form-select"
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value as StorageCondition)}
                    required
                  >
                    <option value="ambient">Ambient (Room Temperature)</option>
                    <option value="chilled">Chilled / Refrigerated (2°C - 4°C)</option>
                    <option value="frozen">Frozen (-18°C)</option>
                    <option value="cool_dry">Cool & Dry Place</option>
                  </select>
                </div>
              </div>

              {/* Quantity and Unit */}
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label htmlFor="create-quantity" className="sl-form-label">
                    Quantity <span className="sl-required">*</span>
                  </label>
                  <input
                    id="create-quantity"
                    type="number"
                    min="1"
                    className="sl-form-input"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="sl-form-group">
                  <label htmlFor="create-unit" className="sl-form-label">
                    Unit <span className="sl-required">*</span>
                  </label>
                  <input
                    id="create-unit"
                    type="text"
                    className="sl-form-input"
                    placeholder="e.g. kg, loaves, packs, cartons, boxes"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Verified Packaging Date & Date Type Section */}
              <div className="sl-date-verification-card">
                <div className="sl-date-verification-card__header">
                  <div className="sl-flex-center gap-2">
                    <Calendar size={18} className="sl-text-primary" />
                    <strong>Verified Packaging Date & Urgency</strong>
                  </div>
                  <button
                    type="button"
                    className="sl-btn sl-btn--subtle sl-btn--xs"
                    onClick={() => setActiveTab('packaging')}
                  >
                    <Camera size={13} />
                    <span>{imageUrl ? 'Inspect OCR Photo' : 'Scan via OCR'}</span>
                  </button>
                </div>

                <div className="sl-form-row sl-mt-2">
                  <div className="sl-form-group">
                    <label htmlFor="create-date" className="sl-form-label">
                      Packaging Date (YYYY-MM-DD) <span className="sl-required">*</span>
                    </label>
                    <input
                      id="create-date"
                      type="date"
                      className="sl-form-input"
                      value={relevantDate}
                      onChange={(e) => setRelevantDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sl-form-group">
                    <label htmlFor="create-datetype" className="sl-form-label">
                      Date Type <span className="sl-required">*</span>
                    </label>
                    <select
                      id="create-datetype"
                      className="sl-form-select"
                      value={dateType}
                      onChange={(e) => setDateType(e.target.value as DateType)}
                      required
                    >
                      <option value="best_before">Best-Before Date</option>
                      <option value="expiry">Expiration Date (EXP)</option>
                      <option value="use_by">Use-By Date</option>
                      <option value="manufacturing">Manufacturing Date (MFD - Non-expiry)</option>
                      <option value="packaging">Packaging Date (PKD - Non-expiry)</option>
                    </select>
                  </div>
                </div>

                {/* Urgency Preview Box */}
                {urgencyPreview && (
                  <div
                    className={`sl-urgency-preview-box sl-urgency-preview-box--${urgencyPreview.badgeVariant}`}
                  >
                    <div className="sl-urgency-preview-box__header">
                      <div className="sl-flex-center gap-2">
                        <Clock size={16} />
                        <strong>
                          Urgency Triage: {urgencyPreview.statusLabel}
                        </strong>
                      </div>
                      <span
                        className={`sl-badge sl-badge--${urgencyPreview.badgeVariant}`}
                      >
                        {urgencyPreview.daysRemaining !== null
                          ? urgencyPreview.daysRemaining >= 0
                            ? `${urgencyPreview.daysRemaining} days left`
                            : 'Date passed'
                          : 'Reference only'}
                      </span>
                    </div>
                    <p className="sl-urgency-preview-box__msg">{urgencyPreview.message}</p>
                    {dateType === 'manufacturing' || dateType === 'packaging' ? (
                      <p className="sl-urgency-preview-box__notice sl-text-muted sl-text-xs">
                        ⚠️ Note: Manufacturing/packing dates do not determine food expiration urgency.
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Human Verification Sign-Off Gate */}
                <div className="sl-human-verify-gate">
                  <div className="sl-human-verify-gate__checkbox-wrap">
                    <label className="sl-checkbox-label">
                      <input
                        type="checkbox"
                        className="sl-checkbox"
                        checked={isManuallyConfirmed}
                        onChange={(e) => setIsManuallyConfirmed(e.target.checked)}
                        required
                      />
                      <span>
                        <strong>I have personally inspected and verified</strong> this packaging date
                        against the printed label. (OCR results are never auto-verified).
                      </span>
                    </label>
                  </div>

                  <div className="sl-form-group sl-mt-2">
                    <label htmlFor="create-verifier" className="sl-form-label">
                      Supervisor / Verifier Name & Role <span className="sl-required">*</span>
                    </label>
                    <input
                      id="create-verifier"
                      type="text"
                      className="sl-form-input"
                      placeholder="e.g. Elena Rostova (Kitchen Lead)"
                      value={verifiedBy}
                      onChange={(e) => setVerifiedBy(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Donor Organization & Pickup Location */}
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label htmlFor="create-donor-org" className="sl-form-label">
                    Donor Organization <span className="sl-required">*</span>
                  </label>
                  <div className="sl-input-with-icon">
                    <Building2 size={16} className="sl-input-icon" />
                    <input
                      id="create-donor-org"
                      type="text"
                      className="sl-form-input sl-form-input--with-icon"
                      placeholder="e.g. GreenMarket Co-op, Campus Mess #3"
                      value={donorOrg}
                      onChange={(e) => setDonorOrg(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="sl-form-group">
                  <label htmlFor="create-contact-phone" className="sl-form-label">
                    Contact Phone
                  </label>
                  <input
                    id="create-contact-phone"
                    type="tel"
                    className="sl-form-input"
                    placeholder="+1 (555) 000-0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="sl-form-group">
                <label htmlFor="create-pickup-loc" className="sl-form-label">
                  Pickup Location & Bay Details <span className="sl-required">*</span>
                </label>
                <div className="sl-input-with-icon">
                  <MapPin size={16} className="sl-input-icon" />
                  <input
                    id="create-pickup-loc"
                    type="text"
                    className="sl-form-input sl-form-input--with-icon"
                    placeholder="e.g. Loading Bay 2, South Kitchen, Campus Area"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Handling Notes */}
              <div className="sl-form-group">
                <label htmlFor="create-notes" className="sl-form-label">
                  Optional Handling & Allergen Notes
                </label>
                <textarea
                  id="create-notes"
                  className="sl-form-textarea"
                  rows={2}
                  placeholder="e.g. Sealed in original carton, keep dry, contains gluten..."
                  value={handlingNotes}
                  onChange={(e) => setHandlingNotes(e.target.value)}
                />
              </div>

              {/* Modal Footer */}
              <div className="sl-modal-footer">
                <button
                  type="button"
                  className="sl-btn sl-btn--subtle"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sl-btn sl-btn--primary"
                  disabled={isSubmitting || !isManuallyConfirmed}
                >
                  <PackagePlus size={16} />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish Food Listing'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
