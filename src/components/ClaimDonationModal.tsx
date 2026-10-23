import React, { useState, useEffect } from 'react';
import {
  X,
  HeartHandshake,
  Calendar,
  Clock,
  Phone,
  User,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Package,
} from 'lucide-react';
import { FoodListing } from '../types/inventory';
import { useAuth } from '../context/AuthContext';

interface ClaimDonationModalProps {
  listing: FoodListing | null;
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: (updatedListing: FoodListing) => void;
}

export const ClaimDonationModal: React.FC<ClaimDonationModalProps> = ({
  listing,
  isOpen,
  onClose,
  onClaimSuccess,
}) => {
  const { user, authFetch, quickDemoLogin } = useAuth();
  const [recipientOrg, setRecipientOrg] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [pickupStart, setPickupStart] = useState('');
  const [pickupEnd, setPickupEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [transportConfirmed, setTransportConfirmed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [claimedListing, setClaimedListing] = useState<FoodListing | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);

  // Set default pickup windows and user data when opened
  useEffect(() => {
    if (isOpen && listing) {
      setErrorMessage(null);
      setClaimedListing(null);
      setTransportConfirmed(false);

      // Default pickup window: today or tomorrow
      const now = new Date();
      now.setMinutes(now.getMinutes() + 120); // 2 hours from now
      const startStr = now.toISOString().slice(0, 16);

      const later = new Date(now);
      later.setHours(later.getHours() + 4);
      const endStr = later.toISOString().slice(0, 16);

      setPickupStart(startStr);
      setPickupEnd(endStr);
      setRecipientOrg(user?.organizationName || 'Hope Community Food Pantry');
      setContactName(user?.contactName || 'David Kalu');
      setContactPhone(user?.phone || '+1 (555) 876-5432');
      setContactEmail(user?.email || 'rescue@foodpantry.org');
      setNotes('Bringing temperature-monitored thermal containers for cold transport.');
    }
  }, [isOpen, listing]);

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

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!recipientOrg.trim()) {
      setErrorMessage('Please specify your recipient organization name.');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMessage('Contact name and telephone number are required.');
      return;
    }
    if (!pickupStart || !pickupEnd) {
      setErrorMessage('Both pickup start and end times are required.');
      return;
    }
    if (!transportConfirmed) {
      setErrorMessage(
        'Please confirm that your team has suitable transport and storage for this category.'
      );
      return;
    }

    if (listing.status !== 'available') {
      setErrorMessage(
        `Listing "${listing.title}" is currently ${listing.status} and cannot be reserved. Please choose an available food listing.`
      );
      return;
    }

    let startIso: string;
    let endIso: string;
    try {
      startIso = new Date(pickupStart).toISOString();
      endIso = new Date(pickupEnd).toISOString();
    } catch {
      setErrorMessage('Please provide valid pickup start and end dates/times.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Ensure the user has an active recipient session
      if (!user || (user.role !== 'recipient' && user.role !== 'admin')) {
        const demoAuth = await quickDemoLogin('recipient');
        if (!demoAuth.success) {
          throw new Error('Please sign in as a recipient organization to reserve donations.');
        }
      }

      const response = await authFetch(`/api/listings/${listing.id}/claim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientOrg: recipientOrg.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactEmail: contactEmail.trim() || undefined,
          pickupWindowStart: startIso,
          pickupWindowEnd: endIso,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            data.error ||
              'This listing was just reserved by another organization. Conflicting claims are prevented.'
          );
        }
        throw new Error(data.error || 'Failed to claim food listing.');
      }

      setClaimedListing(data.data);
    } catch (err: any) {
      console.error('Error claiming listing:', err);
      setErrorMessage(err.message || 'Network error while attempting to reserve listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPin = () => {
    if (claimedListing?.claim?.verificationPin) {
      navigator.clipboard.writeText(claimedListing.claim.verificationPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  return (
    <div
      className="sl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="sl-modal-container sl-modal-container--claim"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sl-modal-header">
          <div className="sl-modal-header__title-box">
            <span className="sl-modal-header__icon-box">
              <HeartHandshake size={20} className="sl-text-primary" />
            </span>
            <div>
              <h2 id="claim-modal-title" className="sl-modal-title">
                {claimedListing ? 'Donation Reservation Confirmed' : 'Reserve Surplus Food Donation'}
              </h2>
              <p className="sl-modal-subtitle">
                {claimedListing
                  ? 'Your pickup code has been issued. Present this at collection.'
                  : 'Coordinate pickup directly with the food donor.'}
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

        {/* Content */}
        <div className="sl-modal-body">
          {errorMessage && (
            <div className="sl-error-banner" role="alert">
              <AlertTriangle size={18} className="sl-text-danger sl-flex-shrink-0" />
              <div>
                <p className="sl-error-banner__message">{errorMessage}</p>
              </div>
            </div>
          )}

          {claimedListing ? (
            /* Reservation Success View */
            <div className="sl-claim-success-card">
              <div className="sl-claim-success-card__badge">
                <CheckCircle2 size={32} className="sl-text-success" />
                <h3>Successfully Reserved!</h3>
                <p>
                  Listing <strong>{claimedListing.title}</strong> is now reserved for{' '}
                  <strong>{claimedListing.claim?.recipientOrg}</strong>.
                </p>
              </div>

              {/* Handover PIN Display */}
              <div className="sl-handover-pin-box">
                <div className="sl-handover-pin-box__label">
                  <span>COLLECTION VERIFICATION PIN</span>
                </div>
                <div className="sl-handover-pin-box__pin">
                  <span>{claimedListing.claim?.verificationPin}</span>
                  <button
                    type="button"
                    className="sl-btn sl-btn--sm sl-btn--subtle"
                    onClick={copyPin}
                    title="Copy PIN to clipboard"
                  >
                    {copiedPin ? <Check size={14} className="sl-text-success" /> : <Copy size={14} />}
                    <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
                  </button>
                </div>
                <p className="sl-handover-pin-box__hint">
                  Show this 4-digit code to the donor kitchen supervisor upon arrival to verify handover.
                </p>
              </div>

              {/* Handover Summary */}
              <div className="sl-handover-details">
                <div className="sl-handover-item">
                  <MapPin size={16} className="sl-text-muted" />
                  <div>
                    <strong>Pickup Location:</strong>
                    <p>{claimedListing.pickupLocation}</p>
                  </div>
                </div>
                <div className="sl-handover-item">
                  <Building2 size={16} className="sl-text-muted" />
                  <div>
                    <strong>Donor Organization:</strong>
                    <p>{claimedListing.donorOrg}</p>
                  </div>
                </div>
                <div className="sl-handover-item">
                  <Clock size={16} className="sl-text-muted" />
                  <div>
                    <strong>Scheduled Pickup Window:</strong>
                    <p>
                      {new Date(claimedListing.claim?.pickupWindowStart || '').toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      —{' '}
                      {new Date(claimedListing.claim?.pickupWindowEnd || '').toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="sl-handover-item">
                  <Package size={16} className="sl-text-muted" />
                  <div>
                    <strong>Batch Quantity:</strong>
                    <p>
                      {claimedListing.quantity} {claimedListing.unit} ({claimedListing.storageCondition}{' '}
                      storage)
                    </p>
                  </div>
                </div>
              </div>

              <div className="sl-modal-footer">
                <button
                  type="button"
                  className="sl-btn sl-btn--primary sl-btn--full"
                  onClick={() => {
                    if (claimedListing) {
                      onClaimSuccess(claimedListing);
                    }
                    onClose();
                  }}
                >
                  Done — View in Recipient Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Reservation Form */
            <form onSubmit={handleSubmit} className="sl-claim-form">
              {/* Food Listing Preview inside Modal */}
              <div className="sl-claim-item-summary">
                {listing.imageUrl ? (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="sl-claim-item-summary__img"
                  />
                ) : (
                  <div className="sl-claim-item-summary__placeholder">
                    <Package size={24} className="sl-text-muted" />
                  </div>
                )}
                <div className="sl-claim-item-summary__details">
                  <div className="sl-claim-item-summary__header-row">
                    <span className="sl-badge sl-badge--sm sl-badge--primary">
                      {listing.category.replace('_', ' ')}
                    </span>
                    <span className="sl-claim-item-summary__donor">
                      <Building2 size={13} />
                      <span>Donor: <strong>{listing.donorOrg}</strong></span>
                    </span>
                  </div>
                  <h4 className="sl-claim-item-summary__title">{listing.title}</h4>
                  <div className="sl-claim-item-summary__meta-row">
                    <span className="sl-claim-item-summary__qty">
                      <strong>
                        {listing.quantity} {listing.unit}
                      </strong>
                    </span>
                    <span className="sl-claim-item-summary__divider">•</span>
                    <span className="sl-claim-item-summary__storage">
                      Storage: <strong>{listing.storageCondition}</strong>
                    </span>
                  </div>
                  <p className="sl-claim-item-summary__loc">
                    <MapPin size={13} /> <span>{listing.pickupLocation}</span>
                  </p>
                </div>
              </div>

              {/* Recipient Organization */}
              <div className="sl-form-group">
                <label htmlFor="claim-recipient-org" className="sl-form-label">
                  Recipient Organization <span className="sl-required">*</span>
                </label>
                <div className="sl-input-with-icon">
                  <Building2 size={16} className="sl-input-icon" />
                  <input
                    id="claim-recipient-org"
                    type="text"
                    className="sl-form-input sl-form-input--with-icon"
                    placeholder="e.g. Hope Food Pantry, City Shelter"
                    value={recipientOrg}
                    onChange={(e) => setRecipientOrg(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Contact Person & Phone */}
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label htmlFor="claim-contact-name" className="sl-form-label">
                    Contact Person <span className="sl-required">*</span>
                  </label>
                  <div className="sl-input-with-icon">
                    <User size={16} className="sl-input-icon" />
                    <input
                      id="claim-contact-name"
                      type="text"
                      className="sl-form-input sl-form-input--with-icon"
                      placeholder="e.g. David Kalu"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="sl-form-group">
                  <label htmlFor="claim-contact-phone" className="sl-form-label">
                    Contact Telephone <span className="sl-required">*</span>
                  </label>
                  <div className="sl-input-with-icon">
                    <Phone size={16} className="sl-input-icon" />
                    <input
                      id="claim-contact-phone"
                      type="tel"
                      className="sl-form-input sl-form-input--with-icon"
                      placeholder="e.g. +1 (555) 876-5432"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Time Window */}
              <div className="sl-form-row">
                <div className="sl-form-group">
                  <label htmlFor="claim-pickup-start" className="sl-form-label">
                    Pickup Window Start <span className="sl-required">*</span>
                  </label>
                  <div className="sl-input-with-icon">
                    <Calendar size={16} className="sl-input-icon" />
                    <input
                      id="claim-pickup-start"
                      type="datetime-local"
                      className="sl-form-input sl-form-input--with-icon"
                      value={pickupStart}
                      onChange={(e) => setPickupStart(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="sl-form-group">
                  <label htmlFor="claim-pickup-end" className="sl-form-label">
                    Pickup Window End <span className="sl-required">*</span>
                  </label>
                  <div className="sl-input-with-icon">
                    <Clock size={16} className="sl-input-icon" />
                    <input
                      id="claim-pickup-end"
                      type="datetime-local"
                      className="sl-form-input sl-form-input--with-icon"
                      value={pickupEnd}
                      onChange={(e) => setPickupEnd(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Handling / Vehicle Notes */}
              <div className="sl-form-group">
                <label htmlFor="claim-notes" className="sl-form-label">
                  Transportation & Handling Notes (Optional)
                </label>
                <textarea
                  id="claim-notes"
                  className="sl-form-textarea"
                  rows={3}
                  placeholder="e.g. Refrigerated van arriving, thermal boxes with ice packs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Safety Confirmation Checkbox */}
              <div className="sl-form-checkbox-card">
                <label className="sl-checkbox-label" htmlFor="claim-transport-confirmed">
                  <input
                    id="claim-transport-confirmed"
                    type="checkbox"
                    className="sl-checkbox"
                    checked={transportConfirmed}
                    onChange={(e) => setTransportConfirmed(e.target.checked)}
                    required
                  />
                  <span>
                    Our organization agrees to collect this food within the stated window and maintain
                    the necessary storage conditions ({listing.storageCondition}) during transport and
                    distribution.
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
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
                  disabled={isSubmitting}
                >
                  <ShieldCheck size={16} />
                  <span>{isSubmitting ? 'Reserving...' : 'Confirm Reservation'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
