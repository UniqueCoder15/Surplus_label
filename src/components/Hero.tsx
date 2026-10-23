import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Package,
  Sprout,
  ShieldCheck,
  HeartHandshake,
  PackageCheck,
  ClipboardCheck,
} from 'lucide-react';

interface HeroProps {
  onOpenDemo: (role?: 'donor' | 'recipient') => void;
  onNavigateToInventory?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDemo, onNavigateToInventory }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'donor' | 'recipient' | 'coordinator'>('donor');

  return (
    <section className="sl-hero" aria-labelledby="hero-heading">
      <div className="sl-container sl-hero__inner">
        {/* Left Column: Narrative, CTAs & 3 Feature Highlight Cards */}
        <div className="sl-hero__content">
          {/* Top Pill from Visual Reference */}
          <div className="sl-badge sl-badge--primary sl-hero__pill">
            <Sprout size={14} className="sl-text-primary" aria-hidden="true" />
            <span>Less Waste, More Impact.</span>
          </div>

          {/* Headline matching Visual Reference */}
          <h1 id="hero-heading" className="sl-hero__title">
            Surplus Food <br />
            <span className="sl-text-primary">Finds the Right People</span>
          </h1>

          {/* Subtitle matching Visual Reference */}
          <p className="sl-hero__lead">
            A simple platform to donate and collect surplus packaged food from shops, hostels, and events.
            Track, verify and coordinate — all in one place.
          </p>

          {/* Action CTAs */}
          <div className="sl-hero__actions">
            <button
              type="button"
              className="sl-btn sl-btn--primary sl-btn--lg"
              onClick={() => (onNavigateToInventory ? onNavigateToInventory() : onOpenDemo('donor'))}
            >
              <span>Explore Food Inventory</span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="sl-btn sl-btn--secondary sl-btn--lg"
              onClick={() => onOpenDemo('donor')}
            >
              <span>Interactive Walkthrough</span>
            </button>
          </div>

          {/* 3 Feature Highlight Cards from Visual Reference */}
          <div className="sl-hero__highlights" aria-label="Key Product Pillars">
            <div className="sl-hero-highlight-card">
              <div className="sl-hero-highlight-card__icon-box">
                <PackageCheck size={20} className="sl-text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="sl-hero-highlight-card__title">Donate Easily</h2>
                <p className="sl-hero-highlight-card__desc">List surplus food in minutes</p>
              </div>
            </div>

            <div className="sl-hero-highlight-card">
              <div className="sl-hero-highlight-card__icon-box">
                <ShieldCheck size={20} className="sl-text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="sl-hero-highlight-card__title">Verified Listings</h2>
                <p className="sl-hero-highlight-card__desc">Check labels and dates for safety</p>
              </div>
            </div>

            <div className="sl-hero-highlight-card">
              <div className="sl-hero-highlight-card__icon-box">
                <HeartHandshake size={20} className="sl-text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="sl-hero-highlight-card__title">Impact Together</h2>
                <p className="sl-hero-highlight-card__desc">Connect with food banks &amp; kitchens</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Fidelity Interactive Product Preview */}
        <div className="sl-hero__visual" aria-label="Interactive SurplusLabel Product Interface Preview">
          <div className="sl-preview-card">
            {/* Preview Card Header with 3 Tabs */}
            <div className="sl-preview-card__header">
              <div className="sl-preview-card__tabs" role="tablist" aria-label="Interface Preview Modes">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === 'donor'}
                  className={`sl-preview-tab ${activePreviewTab === 'donor' ? 'sl-preview-tab--active' : ''}`}
                  onClick={() => setActivePreviewTab('donor')}
                >
                  <Package size={14} aria-hidden="true" />
                  <span>Donor Dashboard</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === 'recipient'}
                  className={`sl-preview-tab ${activePreviewTab === 'recipient' ? 'sl-preview-tab--active' : ''}`}
                  onClick={() => setActivePreviewTab('recipient')}
                >
                  <Truck size={14} aria-hidden="true" />
                  <span>Recipient View</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePreviewTab === 'coordinator'}
                  className={`sl-preview-tab ${activePreviewTab === 'coordinator' ? 'sl-preview-tab--active' : ''}`}
                  onClick={() => setActivePreviewTab('coordinator')}
                >
                  <ClipboardCheck size={14} aria-hidden="true" />
                  <span>Coordinator</span>
                </button>
              </div>
              <span className="sl-preview-card__badge">Live Component</span>
            </div>

            {/* Preview Card Body */}
            <div className="sl-preview-card__body">
              {activePreviewTab === 'donor' && (
                /* Donor Perspective: Packaging Scan & Verification matching screenshot */
                <div className="sl-preview-donor">
                  {/* Item Headline & Urgency Chip */}
                  <div className="sl-preview-donor__top">
                    <div>
                      <span className="sl-preview-donor__category">ABC Hostel Mess • Sector 62, Noida</span>
                      <h2 className="sl-preview-donor__title">Yippee Noodles Multipacks (20 packets)</h2>
                    </div>
                    <div className="sl-badge sl-badge--warning" role="status" aria-label="Urgency status urgent">
                      <Clock size={12} aria-hidden="true" />
                      <span>Urgent (&lt; 6h)</span>
                    </div>
                  </div>

                  {/* OCR Verification Demonstration Box */}
                  <div className="sl-ocr-preview-box">
                    <div className="sl-ocr-preview-box__mock-img">
                      {/* Stylized Pack Graphic */}
                      <div className="sl-ocr-mock-pack">
                        <span className="sl-ocr-mock-pack__brand">Yippee! Instant Noodles</span>
                        <span className="sl-ocr-mock-pack__sub">20 Sealed Packets • Batch #2026-A</span>
                      </div>

                      <div className="sl-ocr-bounding-box">
                        <span className="sl-ocr-bounding-box__tag">Detected Expiration Code</span>
                        <code className="sl-ocr-bounding-box__text">EXP: 25 OCT 2026</code>
                      </div>

                      <div className="sl-ocr-preview-box__overlay-info">
                        <span className="sl-badge sl-badge--success sl-badge--sm">
                          <CheckCircle2 size={12} />
                          <span>96% OCR Match</span>
                        </span>
                      </div>
                    </div>

                    <div className="sl-ocr-preview-box__fields">
                      <div className="sl-field-preview">
                        <span className="sl-field-preview__label">Verified Expiry Date</span>
                        <div className="sl-field-preview__val tabular-nums">
                          <strong>25 Oct 2026</strong>
                          <span className="sl-text-primary">✓ Supervisor Verified</span>
                        </div>
                      </div>
                      <div className="sl-field-preview">
                        <span className="sl-field-preview__label">Quantity &amp; Weight</span>
                        <div className="sl-field-preview__val tabular-nums">
                          <span>20 packets (1.4 kg total)</span>
                        </div>
                      </div>
                      <div className="sl-field-preview">
                        <span className="sl-field-preview__label">Storage Requirement</span>
                        <div className="sl-field-preview__val">
                          <span className="sl-tag">Cool &amp; dry place. Sealed packets.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Handover Logistics Status Bar */}
                  <div className="sl-logistics-bar">
                    <div className="sl-logistics-bar__meta">
                      <div className="sl-logistics-step sl-logistics-step--done">
                        <span className="sl-logistics-step__dot"></span>
                        <span>Logged</span>
                      </div>
                      <div className="sl-logistics-step sl-logistics-step--done">
                        <span className="sl-logistics-step__dot"></span>
                        <span>Date Verified</span>
                      </div>
                      <div className="sl-logistics-step sl-logistics-step--active">
                        <span className="sl-logistics-step__dot"></span>
                        <span>Assigned: FoodBank Team</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sl-btn sl-btn--primary sl-btn--sm"
                      onClick={() => onOpenDemo('donor')}
                    >
                      Confirm Pickup Code
                    </button>
                  </div>
                </div>
              )}

              {activePreviewTab === 'recipient' && (
                /* Recipient Perspective: Priority Feed matching Screen 5 */
                <div className="sl-preview-recipient">
                  <div className="sl-recipient-feed-header">
                    <span className="sl-text-sm sl-text-muted">Available within 5 km radius</span>
                    <span className="sl-badge sl-badge--warning sl-badge--sm">
                      <Clock size={12} />
                      <span>3 Urgent Batches</span>
                    </span>
                  </div>

                  <div className="sl-recipient-items">
                    {/* Item 1: Yippee */}
                    <div className="sl-recipient-item sl-recipient-item--urgent">
                      <div className="sl-recipient-item__main">
                        <div className="sl-recipient-item__badge-row">
                          <span className="sl-badge sl-badge--danger sl-badge--xs">Urgent (&lt; 4h)</span>
                          <span className="sl-badge sl-badge--secondary sl-badge--xs">ABC Hostel Mess</span>
                        </div>
                        <h3 className="sl-recipient-item__title">Yippee Noodles (20 packets)</h3>
                        <div className="sl-recipient-item__meta">
                          <span>Expiry: 25 Oct 2026</span>
                          <span>•</span>
                          <span className="sl-recipient-item__loc">
                            <MapPin size={12} /> 1.2 km away
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sl-btn sl-btn--primary sl-btn--sm"
                        onClick={() => onOpenDemo('recipient')}
                      >
                        Claim Batch
                      </button>
                    </div>

                    {/* Item 2: Parle-G */}
                    <div className="sl-recipient-item">
                      <div className="sl-recipient-item__main">
                        <div className="sl-recipient-item__badge-row">
                          <span className="sl-badge sl-badge--success sl-badge--xs">Available</span>
                          <span className="sl-badge sl-badge--secondary sl-badge--xs">XYZ Store</span>
                        </div>
                        <h3 className="sl-recipient-item__title">Parle-G Biscuits (20 packets)</h3>
                        <div className="sl-recipient-item__meta">
                          <span>Expiry: 28 Oct 2026</span>
                          <span>•</span>
                          <span className="sl-recipient-item__loc">
                            <MapPin size={12} /> 2.1 km away
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sl-btn sl-btn--secondary sl-btn--sm"
                        onClick={() => onOpenDemo('recipient')}
                      >
                        Reserve
                      </button>
                    </div>

                    {/* Item 3: Amul Milk */}
                    <div className="sl-recipient-item">
                      <div className="sl-recipient-item__main">
                        <div className="sl-recipient-item__badge-row">
                          <span className="sl-badge sl-badge--success sl-badge--xs">Available</span>
                          <span className="sl-badge sl-badge--secondary sl-badge--xs">PQR Event Hall</span>
                        </div>
                        <h3 className="sl-recipient-item__title">Amul Milk Tetra Packs (10 packs)</h3>
                        <div className="sl-recipient-item__meta">
                          <span>Expiry: 22 Oct 2026</span>
                          <span>•</span>
                          <span className="sl-recipient-item__loc">
                            <MapPin size={12} /> 3.4 km away
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="sl-btn sl-btn--secondary sl-btn--sm"
                        onClick={() => onOpenDemo('recipient')}
                      >
                        Reserve
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'coordinator' && (
                /* Coordinator Perspective matching Screen 8 */
                <div className="sl-preview-coordinator">
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
                      <span className="sl-coordinator-stat__lbl">Scheduled</span>
                    </div>
                    <div className="sl-coordinator-stat">
                      <span className="sl-coordinator-stat__num">6</span>
                      <span className="sl-coordinator-stat__lbl">Completed</span>
                    </div>
                  </div>

                  <div className="sl-coordinator-review-item">
                    <div className="sl-coordinator-review-item__head">
                      <div>
                        <span className="sl-badge sl-badge--warning sl-badge--xs">Pending Review</span>
                        <h3 className="sl-coordinator-review-item__title">
                          ABC Hostel Mess — Yippee Noodles (20 pkts)
                        </h3>
                        <span className="sl-text-xs sl-text-muted">Extracted Expiry: 25 Oct 2026 • OCR Confidence: 96%</span>
                      </div>
                      <button
                        type="button"
                        className="sl-btn sl-btn--primary sl-btn--sm"
                        onClick={() => onOpenDemo('recipient')}
                      >
                        Review &amp; Approve
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Disclaimer Footer */}
            <div className="sl-preview-card__footer">
              <span className="sl-preview-card__notice">
                *Interactive Exhibition Demonstration Component — Sample Data
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
