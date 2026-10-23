import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Sprout,
  UploadCloud,
  LayoutDashboard,
  Home,
  LogOut,
  KeyRound,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenDemo: (role?: 'donor' | 'recipient' | 'coordinator', donorMode?: 'upload' | 'simulate') => void;
  currentView?: 'landing' | 'inventory';
  onNavigate?: (view: 'landing' | 'inventory') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  currentView = 'landing',
  onNavigate,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Who It’s For', href: '#benefits' },
    { label: 'Impact', href: '#impact' },
  ];

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('landing');
    }
  };

  return (
    <>
      <header
        className={`sl-navbar ${scrolled ? 'sl-navbar--scrolled' : ''}`}
        role="banner"
      >
        <div className="sl-container sl-navbar__inner">
          {/* Brand Logo */}
          <a
            href="#"
            className="sl-brand"
            aria-label="SurplusLabel Home"
            onClick={handleBrandClick}
          >
            <span className="sl-brand__icon-box">
              <Sprout className="sl-brand__icon" size={22} aria-hidden="true" />
            </span>
            <div className="sl-brand__text">
              <span className="sl-brand__name">SurplusLabel</span>
              <span className="sl-brand__badge">Food Rescue</span>
            </div>
          </a>

          {/* Desktop Navigation Links / Tabs */}
          <nav className="sl-navbar__nav" aria-label="Main Navigation">
            <ul className="sl-navbar__links">
              {currentView === 'landing' ? (
                <>
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="sl-navbar__link">
                        {link.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      className="sl-navbar__link sl-navbar__link--highlight"
                      onClick={() => onNavigate && onNavigate('inventory')}
                    >
                      <LayoutDashboard size={14} />
                      <span>Food Inventory</span>
                      <span className="sl-nav-live-pill">Live</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      className="sl-navbar__link"
                      onClick={() => onNavigate && onNavigate('landing')}
                    >
                      <Home size={14} />
                      <span>Home / Overview</span>
                    </button>
                  </li>
                  <li>
                    <span className="sl-navbar__link sl-navbar__link--active">
                      <LayoutDashboard size={14} />
                      <span>Inventory &amp; Donation Triage</span>
                      <span className="sl-nav-live-pill">Active</span>
                    </span>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Action CTAs */}
          <div className="sl-navbar__actions">
            {currentView === 'landing' && (
              <button
                type="button"
                className="sl-btn sl-btn--subtle sl-btn--sm sl-navbar__upload-btn"
                onClick={() => onNavigate && onNavigate('inventory')}
                title="View Live Inventory & Donations"
              >
                <LayoutDashboard size={15} className="sl-text-primary" />
                <span>Inventory</span>
              </button>
            )}

            {user ? (
              <div className="sl-user-chip" title={`Signed in as ${user.contactName} (${user.email})`}>
                <div className="sl-user-chip__info">
                  <span className="sl-user-chip__org">{user.organizationName}</span>
                  <span className="sl-user-chip__name">{user.contactName}</span>
                </div>
                <span className={`sl-role-badge sl-role-badge--${user.role}`}>
                  {user.role === 'donor' && <Sprout size={11} />}
                  {user.role === 'recipient' && <HeartHandshake size={11} />}
                  {user.role === 'admin' && <ShieldCheck size={11} />}
                  <span>{user.role}</span>
                </span>
                <button
                  type="button"
                  className="sl-logout-btn"
                  onClick={() => logout()}
                  title="Sign out of SurplusLabel"
                >
                  <LogOut size={13} />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary sl-btn--sm"
                  onClick={() => openAuthModal('login')}
                >
                  <KeyRound size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  className="sl-btn sl-btn--primary sl-btn--sm"
                  onClick={() => openAuthModal('register')}
                >
                  <span>Register</span>
                </button>
              </>
            )}

            {currentView === 'inventory' && (
              <button
                type="button"
                className="sl-btn sl-btn--subtle sl-btn--sm"
                onClick={() => onNavigate && onNavigate('landing')}
              >
                <Home size={15} />
                <span>Home</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            className="sl-navbar__mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="sl-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            id="sl-mobile-menu"
            className="sl-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <motion.div
              className="sl-mobile-drawer__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="sl-mobile-drawer__panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              <div className="sl-mobile-drawer__header">
                <div className="sl-brand">
                  <span className="sl-brand__icon-box">
                    <Sprout size={20} />
                  </span>
                  <span className="sl-brand__name">SurplusLabel</span>
                </div>
                <button
                  type="button"
                  className="sl-mobile-drawer__close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Menu"
                >
                  <X size={22} />
                </button>
              </div>

              <nav className="sl-mobile-drawer__nav">
                <ul className="sl-mobile-drawer__links">
                  <li>
                    <button
                      type="button"
                      className="sl-mobile-drawer__link sl-mobile-drawer__link--btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate && onNavigate('inventory');
                      }}
                    >
                      <LayoutDashboard size={16} />
                      <strong>Food Inventory Dashboard (Live)</strong>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="sl-mobile-drawer__link sl-mobile-drawer__link--btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onNavigate && onNavigate('landing');
                      }}
                    >
                      <Home size={16} />
                      <span>Home / Overview</span>
                    </button>
                  </li>
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="sl-mobile-drawer__link"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          if (currentView !== 'landing' && onNavigate) {
                            onNavigate('landing');
                          }
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="sl-mobile-drawer__footer">
                <button
                  type="button"
                  className="sl-btn sl-btn--primary sl-btn--md sl-btn--full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate && onNavigate('inventory');
                  }}
                >
                  <LayoutDashboard size={16} />
                  <span>Open Food Inventory</span>
                </button>
                <button
                  type="button"
                  className="sl-btn sl-btn--secondary sl-btn--md sl-btn--full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDemo('donor', 'upload');
                  }}
                >
                  <UploadCloud size={16} className="sl-text-primary" />
                  <span>Upload Label (OCR)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
