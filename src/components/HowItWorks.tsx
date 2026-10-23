import React from 'react';
import { Camera, ScanLine, ClockAlert, Handshake, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Capture',
      subtitle: 'Photo upload & quick data entry',
      icon: Camera,
      description:
        'Upload packaging label photos directly from a mobile camera or kitchen workstation. Enter quantity, packaging type, and temperature storage conditions in under 60 seconds.',
      highlight: 'Works with physical packaging barcodes & stamped date codes',
    },
    {
      number: '02',
      title: 'Verify',
      subtitle: 'OCR assisted date extraction',
      icon: ScanLine,
      description:
        'Computer vision scans printed expiration dates (dot-matrix, ink stamped, and printed labels). Supervisors review the extracted dates side-by-side with confidence scores to prevent errors.',
      highlight: 'Strict human-in-the-loop validation ensures food safety',
    },
    {
      number: '03',
      title: 'Prioritize',
      subtitle: 'Urgency-based triage engine',
      icon: ClockAlert,
      description:
        'Automated classification groups inventory into Critical (< 6h), Impending (< 24h), and Fresh categories. Prevents alarm fatigue with steady, high-visibility countdown indicators.',
      highlight: 'Time-decay scoring ensures near-expiry foods are dispatched first',
    },
    {
      number: '04',
      title: 'Coordinate',
      subtitle: 'Transparent pickup handover',
      icon: Handshake,
      description:
        'Nearby food banks and community kitchens claim matching batches. Direct pickup time slots and verification PIN codes ensure accountable transfer from donor to recipient.',
      highlight: 'Digital chain-of-custody logging for campus audit compliance',
    },
  ];

  return (
    <section id="how-it-works" className="sl-section sl-how-it-works" aria-labelledby="how-it-works-heading">
      <div className="sl-container">
        {/* Section Heading */}
        <div className="sl-section-header">
          <span className="sl-section-header__tag">End-to-End Workflow</span>
          <h2 id="how-it-works-heading" className="sl-section-header__title">
            A Transparent 4-Step Chain of Custody
          </h2>
          <p className="sl-section-header__lead">
            Moving edible surplus packaged food from campus mess kitchens and grocery retailers to community tables
            requires speed, accuracy, and clear responsibility.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="sl-steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="sl-step-card">
                <div className="sl-step-card__top">
                  <span className="sl-step-card__number">{step.number}</span>
                  <div className="sl-step-card__icon-wrap">
                    <Icon className="sl-step-card__icon" size={24} aria-hidden="true" />
                  </div>
                </div>

                <div className="sl-step-card__body">
                  <h3 className="sl-step-card__title">{step.title}</h3>
                  <span className="sl-step-card__subtitle">{step.subtitle}</span>
                  <p className="sl-step-card__desc">{step.description}</p>
                </div>

                <div className="sl-step-card__footer">
                  <div className="sl-step-card__highlight">
                    <CheckCircle2 size={14} className="sl-text-primary" aria-hidden="true" />
                    <span>{step.highlight}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
