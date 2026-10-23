import { Sprout } from 'lucide-react';

interface FooterProps {
  onOpenDemo: (role?: 'donor' | 'recipient') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDemo }) => {
  return (
    <footer className="sl-footer" role="contentinfo">
      <div className="sl-container">
        <div className="sl-footer__grid">
          {/* Brand Col */}
          <div className="sl-footer__brand-col">
            <div className="sl-brand">
              <span className="sl-brand__icon-box">
                <Sprout size={22} className="sl-brand__icon" aria-hidden="true" />
              </span>
              <span className="sl-brand__name">SurplusLabel</span>
            </div>
            <p className="sl-footer__tagline">
              Smart surplus food management and donation coordination.
              Pairing computer vision date extraction with human verification to eliminate edible food waste.
            </p>
            <div className="sl-footer__exhibition-tag">
              <span>University AI Engineering Exhibition 2026 Showcase</span>
            </div>
          </div>

          {/* Navigation Col */}
          <div className="sl-footer__links-col">
            <h3 className="sl-footer__col-title">Navigation</h3>
            <ul className="sl-footer__list">
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#benefits">Donor &amp; Recipient Benefits</a></li>
              <li><a href="#impact">Impact Telemetry</a></li>
            </ul>
          </div>

          {/* System Specs Col */}
          <div className="sl-footer__links-col">
            <h3 className="sl-footer__col-title">Design System</h3>
            <ul className="sl-footer__list">
              <li><a href="#design-system" onClick={(e) => { e.preventDefault(); onOpenDemo('donor'); }}>Design Tokens (docs)</a></li>
              <li><a href="#components" onClick={(e) => { e.preventDefault(); onOpenDemo('donor'); }}>Component Specs</a></li>
              <li><a href="#motion" onClick={(e) => { e.preventDefault(); onOpenDemo('donor'); }}>Motion Principles</a></li>
              <li><a href="#a11y" onClick={(e) => { e.preventDefault(); onOpenDemo('recipient'); }}>WCAG 2.2 AA Rules</a></li>
            </ul>
          </div>

          {/* Project & Access Col */}
          <div className="sl-footer__links-col">
            <h3 className="sl-footer__col-title">Prototype Access</h3>
            <ul className="sl-footer__list">
              <li>
                <button
                  type="button"
                  className="sl-footer__btn-link"
                  onClick={() => onOpenDemo('donor')}
                >
                  Donor Quick-Log Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="sl-footer__btn-link"
                  onClick={() => onOpenDemo('recipient')}
                >
                  Food Bank Pickup Queue
                </button>
              </li>
              <li>
                <span className="sl-footer__meta-item">Status: Interactive Prototype v1.0</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="sl-footer__bottom">
          <div className="sl-footer__copy">
            © 2026 SurplusLabel. MIT Licensed. Built for sustainable campus &amp; commercial food redistribution.
          </div>
          <div className="sl-footer__sub-links">
            <span>No Cookies Tracked</span>
            <span>•</span>
            <span>WCAG 2.2 Level AA Accessible</span>
            <span>•</span>
            <span>Human-in-the-Loop Safe</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
