import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types/inventory';

interface ListingDetailsScreenProps {
  listingId?: string;
  onNavigate: (screen: string) => void;
  onOpenClaimModal?: (listing: FoodListing) => void;
}

export const ListingDetailsScreen: React.FC<ListingDetailsScreenProps> = ({
  listingId,
  onNavigate,
  onOpenClaimModal,
}) => {
  const { authFetch } = useAuth();
  const [listing, setListing] = useState<FoodListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('/noodles.jpg');
  const [showContact, setShowContact] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setIsLoading(true);
        // If specific listing ID provided, fetch it; otherwise fetch default or first listing
        const url = listingId ? `/api/listings/${listingId}` : '/api/listings';
        const res = await authFetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const data = Array.isArray(json.data)
              ? (json.data.find((item: any) => item.id === 'lst_demo_006') ||
                 json.data.find((item: any) => item.status === 'available') ||
                 json.data[0])
              : json.data;
            setListing(data);
            if (data?.imageUrl) {
              setSelectedImage(data.imageUrl);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load listing details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId, authFetch]);

  // Fallback presentation item if empty
  const activeItem: FoodListing = listing || {
    id: 'lst_demo_006',
    title: 'Yippee Noodles',
    category: 'canned_packaged',
    quantity: 20,
    unit: 'packets',
    storageCondition: 'cool_dry',
    handlingNotes: 'Stored in cool and dry place. Sealed packets.',
    donorOrg: 'ABC Hostel Mess',
    pickupLocation: 'Sector 62, Noida',
    contactPhone: '+1 (555) 789-0123',
    imageUrl: '/noodles.jpg',
    relevantDate: '2026-10-25',
    dateType: 'expiry',
    isManuallyConfirmed: true,
    verifiedBy: 'Elena Rostova (Kitchen Lead)',
    rawOcrText: 'EXP: 2026-10-25 BATCH #YP-901 MAGIC MASALA',
    ocrConfidence: 98,
    status: 'available',
    urgencyBand: 'urgent',
    urgencyLabel: 'Urgent (2 days left)',
    daysRemaining: 2,
    urgencyBadgeVariant: 'warning',
    canDriveUrgency: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const isUrgent = activeItem.urgencyBand === 'urgent' || activeItem.urgencyBand === 'critical';

  return (
    <div className="sl-details-page-ref">
      <div className="sl-container">
        {/* Back Link */}
        <div className="sl-details-back-bar-ref">
          <button
            type="button"
            className="sl-back-btn-ref"
            onClick={() => onNavigate('browse')}
          >
            <ArrowLeft size={18} />
            <span>Back to Listings</span>
          </button>
        </div>

        {isLoading ? (
          <div className="sl-loading-box-ref">
            <div className="sl-spinner-ref" />
            <p>Loading food listing details...</p>
          </div>
        ) : (
          <div className="sl-details-grid-ref">
            {/* Left Column: Image Gallery */}
            <div className="sl-details-gallery-ref">
              <div className="sl-details-main-image-card-ref">
                <img
                  src={selectedImage || activeItem.imageUrl || '/noodles.jpg'}
                  alt={activeItem.title}
                  className="sl-details-main-img-ref"
                />
              </div>

              {/* Supporting Thumbnails */}
              <div className="sl-details-thumbs-row-ref">
                <button
                  type="button"
                  className={`sl-details-thumb-btn-ref ${selectedImage === (activeItem.imageUrl || '/noodles.jpg') ? 'sl-details-thumb-btn-ref--active' : ''}`}
                  onClick={() => setSelectedImage(activeItem.imageUrl || '/noodles.jpg')}
                >
                  <img
                    src={activeItem.imageUrl || '/noodles.jpg'}
                    alt="Product packaging angle 1"
                    className="sl-details-thumb-img-ref"
                  />
                </button>

                <button
                  type="button"
                  className={`sl-details-thumb-btn-ref ${selectedImage === '/sample-food-label-crisp.jpg' ? 'sl-details-thumb-btn-ref--active' : ''}`}
                  onClick={() => setSelectedImage('/sample-food-label-crisp.jpg')}
                >
                  <img
                    src="/sample-food-label-crisp.jpg"
                    alt="Food date label macro shot"
                    className="sl-details-thumb-img-ref"
                  />
                </button>
              </div>
            </div>

            {/* Right Column: Listing Meta & Actions */}
            <div className="sl-details-info-card-ref">
              {/* Title & Urgency Pill */}
              <div className="sl-details-title-row-ref">
                <h1 className="sl-details-title-ref">{activeItem.title}</h1>
                {isUrgent && (
                  <span className="sl-status-pill-ref sl-status-pill-ref--urgent">
                    Urgent
                  </span>
                )}
              </div>

              {/* Meta List matching Reference */}
              <div className="sl-details-meta-list-ref">
                <div className="sl-details-meta-item-ref">
                  <span className="sl-details-meta-label-ref">Quantity</span>
                  <span className="sl-details-meta-val-ref">
                    {activeItem.quantity} {activeItem.unit}
                  </span>
                </div>

                <div className="sl-details-meta-item-ref">
                  <span className="sl-details-meta-label-ref">Expiry Date</span>
                  <span className="sl-details-meta-val-ref">
                    {activeItem.relevantDate}
                  </span>
                </div>

                <div className="sl-details-meta-item-ref">
                  <span className="sl-details-meta-label-ref">Listed By</span>
                  <span className="sl-details-meta-val-ref">
                    {activeItem.donorOrg}
                  </span>
                </div>

                <div className="sl-details-meta-item-ref">
                  <span className="sl-details-meta-label-ref">Location</span>
                  <span className="sl-details-meta-val-ref">
                    {activeItem.pickupLocation}
                  </span>
                </div>

                {activeItem.handlingNotes && (
                  <div className="sl-details-meta-item-ref">
                    <span className="sl-details-meta-label-ref">Additional Notes</span>
                    <span className="sl-details-meta-val-ref">
                      {activeItem.handlingNotes}
                    </span>
                  </div>
                )}
              </div>

              {/* OCR Human Verification Seal */}
              <div className="sl-details-verification-box-ref">
                <ShieldCheck size={20} className="sl-verify-seal-icon-ref" />
                <div className="sl-verify-seal-text-ref">
                  <strong>Date Verified by Kitchen Lead</strong>
                  <span>Label OCR scanned with {activeItem.ocrConfidence || 96}% accuracy score.</span>
                </div>
              </div>

              {/* Handover PIN Display if claimed */}
              {activeItem.claim && (
                <div className="sl-details-pin-box-ref">
                  <Lock size={18} />
                  <div>
                    <span className="sl-pin-label-ref">Handover Verification PIN:</span>
                    <span className="sl-pin-code-ref">
                      {activeItem.claim.verificationPin || '••••'}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions Row */}
              <div className="sl-details-actions-ref">
                <button
                  type="button"
                  className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--lg"
                  onClick={() => {
                    if (onOpenClaimModal) {
                      onOpenClaimModal(activeItem);
                    } else {
                      setClaimSuccess(true);
                    }
                  }}
                  disabled={activeItem.status === 'collected' || activeItem.status === 'claimed'}
                >
                  {activeItem.status === 'collected'
                    ? 'Pickup Completed'
                    : activeItem.status === 'claimed'
                    ? 'Pickup Scheduled (Reserved)'
                    : 'Request Pickup'}
                </button>

                <button
                  type="button"
                  className="sl-btn-ref sl-btn-ref--outline sl-btn-ref--lg"
                  onClick={() => setShowContact(!showContact)}
                >
                  Contact Donor
                </button>
              </div>

              {/* Contact Reveal */}
              {showContact && (
                <div className="sl-contact-reveal-card-ref">
                  <Phone size={16} />
                  <div>
                    <strong>Direct Donor Contact:</strong>
                    <p>{activeItem.contactPhone || '+1 (555) 789-0123'} (ABC Hostel Mess Coordinator)</p>
                  </div>
                </div>
              )}

              {claimSuccess && (
                <div className="sl-auth-success-banner-ref" role="status">
                  <CheckCircle2 size={16} />
                  <span>Pickup request submitted! Check your Recipient Dashboard.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
