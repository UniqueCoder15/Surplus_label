import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface FinalCTAProps {
  onOpenDemo: (role?: 'donor' | 'recipient') => void;
  onNavigateToInventory?: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenDemo, onNavigateToInventory }) => {
  return (
    <section className="sl-final-cta" aria-labelledby="cta-heading">
      <div className="sl-container">
        <div className="sl-final-cta__box">
          <div className="sl-final-cta__content">
            <div className="sl-badge sl-badge--primary sl-final-cta__pill">
              <Sparkles size={14} className="sl-badge__icon" aria-hidden="true" />
              <span>AI Engineering Exhibition 2026</span>
            </div>

            <h2 id="cta-heading" className="sl-final-cta__title">
              Ready to Transform Edible Surplus into Community Nutrition?
            </h2>

            <p className="sl-final-cta__desc">
              Experience the working SurplusLabel prototype. Test image label uploading,
              OCR date extraction simulation, urgency triage feeds, and transparent pickup handovers.
            </p>

            <div className="sl-final-cta__actions">
              <button
                type="button"
                className="sl-btn sl-btn--primary sl-btn--lg"
                onClick={() => (onNavigateToInventory ? onNavigateToInventory() : onOpenDemo('donor'))}
              >
                <span>View Food Inventory &amp; Claims</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="sl-btn sl-btn--secondary sl-btn--lg"
                onClick={() => onOpenDemo('donor')}
              >
                <span>Launch Prototype Walkthrough</span>
              </button>
            </div>

            <div className="sl-final-cta__safety-note">
              <ShieldCheck size={16} className="sl-text-primary" aria-hidden="true" />
              <span>Built with strict WCAG 2.2 AA accessibility and human-supervised verification protocols.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
