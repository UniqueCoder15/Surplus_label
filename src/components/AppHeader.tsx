import React, { useState } from 'react';
import { Sprout, Bell, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onOpenDemo?: (role?: 'donor' | 'recipient' | 'coordinator', donorMode?: 'upload' | 'simulate') => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initial = user?.contactName
    ? user.contactName.charAt(0).toUpperCase()
    : currentScreen === 'coordinator'
    ? 'C'
    : currentScreen === 'recipient' || currentScreen === 'browse'
    ? 'R'
    : 'D';

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : currentScreen === 'coordinator'
    ? 'Coordinator'
    : currentScreen === 'recipient'
    ? 'Recipient'
    : 'Donor';

  // Determine center navigation links based on current screen / context
  const renderCenterNav = () => {
    if (currentScreen === 'landing') {
      return (
        <ul className="sl-header-nav-list-ref">
          <li>
            <button
              type="button"
              className="sl-header-link-ref sl-header-link-ref--active"
              onClick={() => onNavigate('landing')}
            >
              Home
            </button>
          </li>
          <li>
            <a href="#about" className="sl-header-link-ref">
              About
            </a>
          </li>
          <li>
            <a href="#how-it-works" className="sl-header-link-ref">
              How It Works
            </a>
          </li>
          <li>
            <a href="#contact" className="sl-header-link-ref">
              Contact
            </a>
          </li>
        </ul>
      );
    }

    if (currentScreen === 'donor' || currentScreen === 'add-food') {
      return (
        <ul className="sl-header-nav-list-ref">
          <li>
            <button
              type="button"
              className={`sl-header-link-ref ${currentScreen === 'donor' ? 'sl-header-link-ref--active' : ''}`}
              onClick={() => onNavigate('donor')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sl-header-link-ref ${currentScreen === 'add-food' ? 'sl-header-link-ref--active' : ''}`}
              onClick={() => onNavigate('add-food')}
            >
              Add Food
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('browse')}
            >
              My Listings
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('profile')}
            >
              Profile
            </button>
          </li>
        </ul>
      );
    }

    if (currentScreen === 'recipient') {
      return (
        <ul className="sl-header-nav-list-ref">
          <li>
            <button
              type="button"
              className="sl-header-link-ref sl-header-link-ref--active"
              onClick={() => onNavigate('recipient')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('browse')}
            >
              Browse Food
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('coordinator')}
            >
              My Requests
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('profile')}
            >
              Profile
            </button>
          </li>
        </ul>
      );
    }

    if (currentScreen === 'browse' || currentScreen === 'details') {
      return (
        <ul className="sl-header-nav-list-ref">
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('landing')}
            >
              Home
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref sl-header-link-ref--active"
              onClick={() => onNavigate('browse')}
            >
              Browse Food
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('donor')}
            >
              Donor Hub
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('profile')}
            >
              Profile
            </button>
          </li>
        </ul>
      );
    }

    if (currentScreen === 'coordinator') {
      return (
        <ul className="sl-header-nav-list-ref">
          <li>
            <button
              type="button"
              className="sl-header-link-ref sl-header-link-ref--active"
              onClick={() => onNavigate('coordinator')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('browse')}
            >
              All Listings
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('notifications')}
            >
              Pickup Requests
            </button>
          </li>
          <li>
            <button
              type="button"
              className="sl-header-link-ref"
              onClick={() => onNavigate('profile')}
            >
              Users
            </button>
          </li>
        </ul>
      );
    }

    // Default nav
    return (
      <ul className="sl-header-nav-list-ref">
        <li>
          <button
            type="button"
            className="sl-header-link-ref"
            onClick={() => onNavigate('landing')}
          >
            Home
          </button>
        </li>
        <li>
          <button
            type="button"
            className="sl-header-link-ref"
            onClick={() => onNavigate('browse')}
          >
            Browse
          </button>
        </li>
        <li>
          <button
            type="button"
            className="sl-header-link-ref"
            onClick={() => onNavigate('donor')}
          >
            Donor
          </button>
        </li>
        <li>
          <button
            type="button"
            className="sl-header-link-ref"
            onClick={() => onNavigate('profile')}
          >
            Profile
          </button>
        </li>
      </ul>
    );
  };

  return (
    <header className="sl-app-header-ref">
      <div className="sl-container sl-app-header-inner-ref">
        {/* Logo */}
        <div
          className="sl-header-logo-ref"
          onClick={() => onNavigate('landing')}
          role="button"
          tabIndex={0}
        >
          <Sprout className="sl-header-logo-icon-ref" size={22} />
          <span className="sl-header-logo-title-ref">SurplusLabel</span>
        </div>

        {/* Center Nav for Desktop */}
        <nav className="sl-header-nav-ref" aria-label="Main Navigation">
          {renderCenterNav()}
        </nav>

        {/* Right Actions */}
        <div className="sl-header-right-ref">
          {currentScreen === 'landing' ? (
            <div className="sl-header-auth-btns-ref">
              <button
                type="button"
                className="sl-header-login-btn-ref"
                onClick={() => onNavigate('auth')}
              >
                Login
              </button>
              <button
                type="button"
                className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--pill"
                onClick={() => onNavigate('auth')}
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="sl-header-user-row-ref">
              {/* Notifications Icon Button */}
              <button
                type="button"
                className={`sl-header-icon-btn-ref ${currentScreen === 'notifications' ? 'sl-header-icon-btn-ref--active' : ''}`}
                onClick={() => onNavigate('notifications')}
                aria-label="View notifications"
              >
                <Bell size={20} />
                <span className="sl-header-notif-dot-ref" />
              </button>

              {/* Avatar Initial Circle */}
              <button
                type="button"
                className="sl-header-avatar-btn-ref"
                onClick={() => onNavigate('profile')}
                aria-label={`Open profile for ${user?.contactName || 'user'}`}
                title={`${user?.contactName || 'User'} (${roleLabel})`}
              >
                <span>{initial}</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="sl-header-mobile-toggle-ref"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sl-header-mobile-drawer-ref">
          <div className="sl-header-mobile-links-ref">
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('landing');
                setMobileMenuOpen(false);
              }}
            >
              1. Landing Page
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('auth');
                setMobileMenuOpen(false);
              }}
            >
              2. Register / Login Page
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('donor');
                setMobileMenuOpen(false);
              }}
            >
              3. Donor Dashboard
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('add-food');
                setMobileMenuOpen(false);
              }}
            >
              4. Add Food Listing
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('browse');
                setMobileMenuOpen(false);
              }}
            >
              5. Food Listings (Browse)
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('details');
                setMobileMenuOpen(false);
              }}
            >
              6. Listing Details
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('recipient');
                setMobileMenuOpen(false);
              }}
            >
              7. Recipient Dashboard
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('coordinator');
                setMobileMenuOpen(false);
              }}
            >
              8. Coordinator Dashboard
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('notifications');
                setMobileMenuOpen(false);
              }}
            >
              9. Notifications
            </button>
            <button
              type="button"
              className="sl-mobile-link-ref"
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
            >
              10. Profile
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
