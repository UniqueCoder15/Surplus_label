import React from 'react';
import { ArrowRight, FileText, ShieldCheck, HeartHandshake } from 'lucide-react';
import { motion } from 'motion/react';
import { HowItWorks } from '../components/HowItWorks';
import { Features } from '../components/Features';
import { Benefits } from '../components/Benefits';
import { Impact } from '../components/Impact';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';

interface LandingScreenProps {
  onNavigate: (screen: string) => void;
  onOpenDemo?: (role?: 'donor' | 'recipient' | 'coordinator', donorMode?: 'upload' | 'simulate') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigate, onOpenDemo }) => {
  const handleOpenDemo = (role?: 'donor' | 'recipient') => {
    if (onOpenDemo) {
      onOpenDemo(role);
    }
  };
  return (
    <div className="sl-landing-ref">
      {/* Hero Section */}
      <section className="sl-hero-ref" aria-labelledby="hero-heading">
        <div className="sl-container sl-hero-ref__container">
          <div className="sl-hero-ref__grid">
            {/* Left Content Column */}
            <motion.div
              className="sl-hero-ref__content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {/* Badge Tag */}
              <div className="sl-hero-ref__badge">
                <span className="sl-hero-ref__badge-dot" />
                <span>Less Waste. More Impact.</span>
              </div>

              {/* Main Headline */}
              <h1 id="hero-heading" className="sl-hero-ref__headline">
                Surplus Food <br />
                Finds the Right People
              </h1>

              {/* Supporting Subtitle */}
              <p className="sl-hero-ref__sub">
                A simple platform to donate and collect surplus packaged food from shops,
                hostels, and events. Track, verify and coordinate — all in one place.
              </p>

              {/* Action Buttons */}
              <div className="sl-hero-ref__actions">
                <button
                  type="button"
                  className="sl-btn-ref sl-btn-ref--primary"
                  onClick={() => onNavigate('auth')}
                >
                  Get Started
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <a
                  href="#how-it-works"
                  className="sl-btn-ref sl-btn-ref--secondary"
                >
                  Learn More
                </a>
              </div>
            </motion.div>

            {/* Right Visual Box Illustration */}
            <motion.div
              className="sl-hero-ref__visual"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
              <div className="sl-hero-ref__image-card">
                <img
                  src="/food-box-hero.jpg"
                  alt="Open box filled with surplus packaged foods labeled Good Food for Better Tomorrow"
                  className="sl-hero-ref__image"
                />
              </div>
            </motion.div>
          </div>

          {/* Supporting 3-Card Feature Row */}
          <motion.div
            className="sl-feature-row-ref"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="sl-feature-card-ref">
              <div className="sl-feature-card-ref__icon-box">
                <FileText className="sl-feature-card-ref__icon" size={24} />
              </div>
              <div className="sl-feature-card-ref__text">
                <h3 className="sl-feature-card-ref__title">Donate Easily</h3>
                <p className="sl-feature-card-ref__desc">List surplus food in minutes</p>
              </div>
            </div>

            <div className="sl-feature-card-ref">
              <div className="sl-feature-card-ref__icon-box">
                <ShieldCheck className="sl-feature-card-ref__icon" size={24} />
              </div>
              <div className="sl-feature-card-ref__text">
                <h3 className="sl-feature-card-ref__title">Verified Listings</h3>
                <p className="sl-feature-card-ref__desc">Check labels and dates for safety</p>
              </div>
            </div>

            <div className="sl-feature-card-ref">
              <div className="sl-feature-card-ref__icon-box">
                <HeartHandshake className="sl-feature-card-ref__icon" size={24} />
              </div>
              <div className="sl-feature-card-ref__text">
                <h3 className="sl-feature-card-ref__title">Impact Together</h3>
                <p className="sl-feature-card-ref__desc">Connect with food banks and community kitchens</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Structured Informational Sections */}
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="benefits">
        <Benefits onOpenDemo={handleOpenDemo} />
      </div>
      <div id="impact">
        <Impact />
      </div>
      <FinalCTA
        onOpenDemo={handleOpenDemo}
        onNavigateToInventory={() => onNavigate('browse')}
      />
      <Footer onOpenDemo={handleOpenDemo} />
    </div>
  );
};
