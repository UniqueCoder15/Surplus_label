import React from 'react';
import { Store, HeartHandshake, Check, ArrowRight } from 'lucide-react';

interface BenefitsProps {
  onOpenDemo: (role?: 'donor' | 'recipient') => void;
}

export const Benefits: React.FC<BenefitsProps> = ({ onOpenDemo }) => {
  const donorBenefits = [
    'Log surplus packaging in under 60 seconds with mobile label photo capture',
    'Prevent good food from reaching the trash with proactive expiry alerts',
    'Generate transparent food waste diversion logs for campus sustainability audits',
    'Schedule orderly, contactless pickups without disruptive phone calls',
    'Protect food integrity with mandatory supervisor verification sign-off',
  ];

  const recipientBenefits = [
    'Real-time alerts for incoming urgent batches within your geographic radius',
    'Pre-verified expiration dates ensure your kitchen never receives expired items',
    'Instant visibility into dietary classifications, packaging types, and storage rules',
    'Accountable PIN-based collection handover for complete volunteer safety',
    'Track total kilograms rescued and meals distributed for donor community reports',
  ];

  return (
    <section id="benefits" className="sl-section sl-benefits" aria-labelledby="benefits-heading">
      <div className="sl-container">
        <div className="sl-section-header">
          <span className="sl-section-header__tag">Two Sided Ecosystem</span>
          <h2 id="benefits-heading" className="sl-section-header__title">
            Built for Both Ends of the Redistribution Chain
          </h2>
          <p className="sl-section-header__lead">
            Whether you operate a high-volume campus dining hall or a neighborhood food pantry,
            SurplusLabel adapts to your operational tempo.
          </p>
        </div>

        <div className="sl-benefits-grid">
          {/* Card 1: Food Donors */}
          <div className="sl-benefit-card sl-benefit-card--donor">
            <div className="sl-benefit-card__header">
              <div className="sl-benefit-card__icon-wrap">
                <Store size={24} className="sl-text-primary" aria-hidden="true" />
              </div>
              <div>
                <span className="sl-benefit-card__role">Food Donors</span>
                <h3 className="sl-benefit-card__title">Shops, Hostel Messes &amp; Caterers</h3>
              </div>
            </div>

            <p className="sl-benefit-card__desc">
              Transform end-of-day surplus inventory into verified community meals instead of municipal waste.
            </p>

            <ul className="sl-benefit-card__list">
              {donorBenefits.map((item) => (
                <li key={item} className="sl-benefit-card__list-item">
                  <span className="sl-benefit-card__check">
                    <Check size={14} className="sl-text-primary" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="sl-benefit-card__action">
              <button
                type="button"
                className="sl-btn sl-btn--primary sl-btn--md sl-btn--full"
                onClick={() => onOpenDemo('donor')}
              >
                <span>Donor Dashboard Preview</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Card 2: Food Recipients */}
          <div className="sl-benefit-card sl-benefit-card--recipient">
            <div className="sl-benefit-card__header">
              <div className="sl-benefit-card__icon-wrap sl-benefit-card__icon-wrap--teal">
                <HeartHandshake size={24} className="sl-text-secondary" aria-hidden="true" />
              </div>
              <div>
                <span className="sl-benefit-card__role">Food Recipients</span>
                <h3 className="sl-benefit-card__title">Food Banks &amp; Community Pantries</h3>
              </div>
            </div>

            <p className="sl-benefit-card__desc">
              Gain predictable, verified surplus food deliveries without sorting through unverified or expired goods.
            </p>

            <ul className="sl-benefit-card__list">
              {recipientBenefits.map((item) => (
                <li key={item} className="sl-benefit-card__list-item">
                  <span className="sl-benefit-card__check sl-benefit-card__check--teal">
                    <Check size={14} className="sl-text-secondary" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="sl-benefit-card__action">
              <button
                type="button"
                className="sl-btn sl-btn--secondary sl-btn--md sl-btn--full"
                onClick={() => onOpenDemo('recipient')}
              >
                <span>Recipient Portal Preview</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
