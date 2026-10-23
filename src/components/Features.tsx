import React from 'react';
import {
  UploadCloud,
  FileSearch,
  CheckCheck,
  Hourglass,
  Search,
  Users,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: UploadCloud,
      title: 'Food-Label Image Capture',
      desc: 'Mobile-first dropzones allow staff to photograph packaged food labels directly from kitchen preparation tables or retail storage bays.',
    },
    {
      icon: FileSearch,
      title: 'OCR-Assisted Date Extraction',
      desc: 'Computer vision parses printed expiry dates and batch numbers across varying packaging backgrounds and typography types.',
    },
    {
      icon: CheckCheck,
      title: 'Mandatory Human Verification',
      desc: 'OCR suggestions are never committed without supervisor sign-off. High, medium, and low confidence scores guide careful human review.',
    },
    {
      icon: Hourglass,
      title: 'Urgency Triage & Expiry Sorting',
      desc: 'Categorizes batches into Critical (<6h), Impending (<24h), and Stable. Highlights nearest expiry items first without alarming strobe effects.',
    },
    {
      icon: Search,
      title: 'Searchable Surplus Feed',
      desc: 'Filter listings by dietary requirements (vegetarian, vegan, halal, allergen-free), storage type (chilled vs ambient), and proximity.',
    },
    {
      icon: Users,
      title: 'Donor & Recipient Pairing',
      desc: 'Direct connection between campus hostel mess managers, retail stores, and verified non-profit hunger relief organizations.',
    },
    {
      icon: CalendarCheck,
      title: 'Pickup Scheduling & Status PIN',
      desc: 'Coordinate exact collection windows. Secure handover confirmation PIN codes prevent unauthorized batch pick-ups.',
    },
    {
      icon: ShieldAlert,
      title: 'Compliance & Safety Disclaimers',
      desc: 'SurplusLabel provides organizational tools and date extraction assistance. Food safety decisions remain with trained kitchen supervisors.',
    },
  ];

  return (
    <section id="features" className="sl-section sl-features" aria-labelledby="features-heading">
      <div className="sl-container">
        <div className="sl-section-header">
          <span className="sl-section-header__tag">System Capabilities</span>
          <h2 id="features-heading" className="sl-section-header__title">
            Engineered for Real-World Food Recovery
          </h2>
          <p className="sl-section-header__lead">
            Every feature is designed to reduce the cognitive burden on kitchen staff while keeping food safety,
            audit compliance, and community trust front and center.
          </p>
        </div>

        <div className="sl-features-grid">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="sl-feature-card">
                <div className="sl-feature-card__icon-wrap">
                  <Icon size={22} className="sl-text-primary" aria-hidden="true" />
                </div>
                <h3 className="sl-feature-card__title">{feat.title}</h3>
                <p className="sl-feature-card__desc">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
