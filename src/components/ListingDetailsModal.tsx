import React, { useState } from 'react';
import {
  X,
  Package,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  FileText,
  User,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { FoodListing } from '../types/inventory';
import { formatDisplayDate } from '../utils/ocrDateParser';
import { useAuth } from '../context/AuthContext';

interface ListingDetailsModalProps {
  listing: FoodListing | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenClaim: (listing: FoodListing) => void;
  onStatusUpdate: (id: string, newStatus: any, notes?: string) => Promise<void>;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({
  listing,
  isOpen,
  onClose,
  onOpenClaim,
  onStatusUpdate,
}) => {
  const { user, openAuthModal } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  if (!isOpen || !listing) return null;

  const isOwner = user && (user.id === listing.donorUserId || user.organizationName.toLowerCase() === listing.donorOrg.toLowerCase());
  const isClaimant = user && (user.id === listing.claim?.recipientUserId || user.organizationName.toLowerCase() === listing.claim?.recipientOrg.toLowerCase());
  const isAdmin = user?.role === 'admin';
  const isPinMasked = listing.claim?.verificationPin.includes('•');

  const handleMarkCollected = async () => {
    try {
      setIsUpdatingStatus(true);
      setStatusActionError(null);
      await onStatusUpdate(listing.id, 'collected', 'Handover confirmed with recipient.');
    } catch (err: any) {
      setStatusActionError(err.message || 'Failed to update handover status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelClaim = async () => {
    if (!window.confirm('Are you sure you want to release this reservation back to available?')) {
      return;
    }
    try {
      setIsUpdatingStatus(true);
      setStatusActionError(null);
      await onStatusUpdate(listing.id, 'available', 'Reservation cancelled/released by supervisor.');
    } catch (err: any) {
      setStatusActionError(err.message || 'Failed to cancel reservation.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const badgeVariant = listing.urgencyBadgeVariant || 'neutral';

  return (
    <div
      className="sl-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-modal-title"
    >
      <div className="sl-modal-container sl-modal-container--details">
        {/* Header */}
        <div className="sl-modal-header">
          <div className="sl-modal-header__title-box">
            <span className="sl-modal-header__icon-box">
              <Package size={20} className="sl-text-primary" />
            </span>
            <div>
              <div className="sl-modal-header__badges">
                <span className={`sl-badge sl-badge--status sl-badge--status-${listing.status}`}>
                  {listing.status.toUpperCase()}
                </span>
                <span className={`sl-badge sl-badge--${badgeVariant}`}>
                  {listing.urgencyLabel}
                </span>
                {listing.isDemo && (
                  <span className="sl-badge sl-badge--subtle">Demo Sample</span>
                )}
              </div>
              <h2 id="details-modal-title" className="sl-modal-title">
                {listing.title}
              </h2>
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

        {/* Body */}
        <div className="sl-modal-body sl-details-modal-body">
          {statusActionError && (
            <div className="sl-error-banner" role="alert">
              <AlertTriangle size={18} className="sl-text-danger sl-flex-shrink-0" />
              <p className="sl-error-banner__message">{statusActionError}</p>
            </div>
          )}

          <div className="sl-details-grid">
            {/* Left Column: Image & Packaging Verification */}
            <div className="sl-details-col">
              <div className="sl-details-card">
                <h3 className="sl-details-card__title">
                  <FileText size={16} /> Packaging & Label Image
                </h3>
                {listing.imageUrl ? (
                  <div className="sl-details-image-container">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="sl-details-image"
                    />
                    <div className="sl-details-image-footer">
                      <a
                        href={listing.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sl-link sl-text-xs"
                      >
                        <ExternalLink size={12} /> Open high-resolution image
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="sl-details-image-placeholder">
                    <Package size={36} className="sl-text-muted" />
                    <p className="sl-text-sm sl-text-muted">No packaging photo uploaded</p>
                  </div>
                )}

                {/* OCR & Human Verification Box */}
                <div className="sl-verification-audit-box">
                  <div className="sl-verification-audit-box__header">
                    <div className="sl-flex-center gap-2">
                      <ShieldCheck size={18} className="sl-text-success" />
                      <strong>Human Verification Sign-Off</strong>
                    </div>
                    <span className="sl-badge sl-badge--success sl-badge--xs">Verified</span>
                  </div>

                  <div className="sl-verification-audit-box__content">
                    <div className="sl-audit-row">
                      <span className="sl-text-muted">Verified Date:</span>
                      <strong className="sl-text-primary">
                        {formatDisplayDate(listing.relevantDate)} ({listing.relevantDate})
                      </strong>
                    </div>
                    <div className="sl-audit-row">
                      <span className="sl-text-muted">Date Type:</span>
                      <span className="sl-font-semibold sl-capitalize">
                        {listing.dateType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="sl-audit-row">
                      <span className="sl-text-muted">Signed Off By:</span>
                      <span>{listing.verifiedBy || 'Kitchen Supervisor'}</span>
                    </div>
                    {listing.verifiedAt && (
                      <div className="sl-audit-row">
                        <span className="sl-text-muted">Timestamp:</span>
                        <span className="sl-text-xs">
                          {new Date(listing.verifiedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {listing.rawOcrText && (
                    <div className="sl-audit-ocr-snippet">
                      <div className="sl-audit-ocr-snippet__title">
                        <Sparkles size={12} /> OCR Text Stream (Confidence: {listing.ocrConfidence || 90}%)
                      </div>
                      <code>{listing.rawOcrText}</code>
                    </div>
                  )}

                  <div className="sl-safety-disclaimer">
                    <Info size={13} className="sl-flex-shrink-0" />
                    <span>
                      SurplusLabel provides organizational tools and date extraction assistance. Food
                      safety decisions remain with trained kitchen supervisors.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Listing Details & Claim Coordination */}
            <div className="sl-details-col">
              {/* Food Batch Profile */}
              <div className="sl-details-card">
                <h3 className="sl-details-card__title">
                  <Package size={16} /> Batch Specifications
                </h3>
                <div className="sl-specs-grid">
                  <div className="sl-spec-item">
                    <span className="sl-spec-label">Available Quantity</span>
                    <span className="sl-spec-val">
                      {listing.quantity} {listing.unit}
                    </span>
                  </div>
                  <div className="sl-spec-item">
                    <span className="sl-spec-label">Category</span>
                    <span className="sl-spec-val sl-capitalize">
                      {listing.category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="sl-spec-item">
                    <span className="sl-spec-label">Storage Requirement</span>
                    <span className="sl-spec-val sl-capitalize">
                      {listing.storageCondition}
                    </span>
                  </div>
                  <div className="sl-spec-item">
                    <span className="sl-spec-label">Urgency Triage</span>
                    <span className={`sl-spec-val sl-badge--${badgeVariant}`}>
                      {listing.urgencyLabel}
                      {typeof listing.daysRemaining === 'number' && (
                        <span> ({listing.daysRemaining >= 0 ? `${listing.daysRemaining}d left` : 'Past'})</span>
                      )}
                    </span>
                  </div>
                </div>

                {listing.handlingNotes && (
                  <div className="sl-handling-notes">
                    <strong>Handling & Storage Notes:</strong>
                    <p>{listing.handlingNotes}</p>
                  </div>
                )}
              </div>

              {/* Donor Organization & Pickup Location */}
              <div className="sl-details-card">
                <h3 className="sl-details-card__title">
                  <Building2 size={16} /> Donor & Pickup Details
                </h3>
                <div className="sl-pickup-info">
                  <div className="sl-pickup-item">
                    <Building2 size={16} className="sl-text-primary" />
                    <div>
                      <span className="sl-text-muted sl-text-xs">Donor Organization</span>
                      <p className="sl-font-semibold">{listing.donorOrg}</p>
                    </div>
                  </div>
                  <div className="sl-pickup-item">
                    <MapPin size={16} className="sl-text-primary" />
                    <div>
                      <span className="sl-text-muted sl-text-xs">Pickup Address / Bay</span>
                      <p className="sl-font-semibold">{listing.pickupLocation}</p>
                    </div>
                  </div>
                  {listing.contactPhone && (
                    <div className="sl-pickup-item">
                      <Phone size={16} className="sl-text-primary" />
                      <div>
                        <span className="sl-text-muted sl-text-xs">Donor Telephone</span>
                        <p className="sl-font-semibold">{listing.contactPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Claim / Coordination Section */}
              {listing.claim ? (
                <div className="sl-details-card sl-details-card--claimed">
                  <div className="sl-flex-between">
                    <h3 className="sl-details-card__title sl-text-primary">
                      <HeartHandshake size={16} /> Active Donation Claim
                    </h3>
                    <span className="sl-badge sl-badge--warning sl-badge--xs">Claimed</span>
                  </div>

                  <div className="sl-claim-summary-card">
                    <div className="sl-claim-recipient-row">
                      <User size={16} className="sl-text-muted" />
                      <div>
                        <strong>{listing.claim.recipientOrg}</strong>
                        <p className="sl-text-xs sl-text-muted">
                          Contact: {listing.claim.contactName} ({listing.claim.contactPhone})
                        </p>
                      </div>
                    </div>

                    <div className="sl-claim-window-row">
                      <Clock size={16} className="sl-text-muted" />
                      <div>
                        <span className="sl-text-muted sl-text-xs">Pickup Window:</span>
                        <p className="sl-text-xs sl-font-semibold">
                          {new Date(listing.claim.pickupWindowStart).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          —{' '}
                          {new Date(listing.claim.pickupWindowEnd).toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {listing.claim.notes && (
                      <p className="sl-claim-notes">
                        <strong>Transport Notes:</strong> {listing.claim.notes}
                      </p>
                    )}

                    <div className={`sl-handover-pin-badge ${isPinMasked ? 'sl-handover-pin-badge--masked' : ''}`}>
                      <span>HANDOVER PIN:</span>
                      <strong>{listing.claim.verificationPin}</strong>
                      {isPinMasked ? (
                        <span className="sl-pin-confidential-note">🔒 Confidential — visible to donor and claiming charity only</span>
                      ) : (
                        <span className="sl-pin-confidential-note">✓ Authorized — verify this PIN with pickup driver</span>
                      )}
                    </div>
                  </div>

                  {/* Donor / Coordinator Action Bar */}
                  {listing.status === 'claimed' && (
                    <div className="sl-claimed-action-buttons">
                      {(isOwner || isAdmin) && (
                        <button
                          type="button"
                          className="sl-btn sl-btn--success sl-btn--sm"
                          onClick={handleMarkCollected}
                          disabled={isUpdatingStatus}
                          title="Confirm that the food batch has been handed over"
                        >
                          <CheckCircle2 size={15} />
                          <span>Confirm Handover (Collected)</span>
                        </button>
                      )}
                      {(isClaimant || isAdmin) && (
                        <button
                          type="button"
                          className="sl-btn sl-btn--subtle sl-btn--sm"
                          onClick={handleCancelClaim}
                          disabled={isUpdatingStatus}
                          title="Release reservation back to available inventory"
                        >
                          <span>Release Reservation</span>
                        </button>
                      )}
                      {!isOwner && !isClaimant && !isAdmin && (
                        <p className="sl-text-xs sl-text-muted" style={{ margin: '4px 0 0 0' }}>
                          🔒 Active reservation. Handover confirmation is managed by <strong>{listing.donorOrg}</strong> and <strong>{listing.claim.recipientOrg}</strong>.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                listing.status === 'available' && (
                  <div className="sl-claim-cta-box">
                    <div>
                      <h4 className="sl-font-semibold">Ready for Community Rescue</h4>
                      <p className="sl-text-xs sl-text-muted">
                        This batch is available for immediate pickup by registered charities and food
                        banks.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="sl-btn sl-btn--primary"
                      onClick={() => {
                        if (!user) {
                          onClose();
                          openAuthModal('login', 'recipient', 'Claiming a surplus donation requires an authenticated Recipient Charity account.');
                          return;
                        }
                        if (user.role === 'donor') {
                          alert('Food Donors cannot claim listings. Please switch to a Recipient Charity account.');
                          return;
                        }
                        onClose();
                        onOpenClaim(listing);
                      }}
                    >
                      <HeartHandshake size={16} />
                      <span>Reserve for Donation</span>
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sl-modal-footer">
          <button type="button" className="sl-btn sl-btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
