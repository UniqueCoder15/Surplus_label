import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  Building2,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  HeartHandshake,
  Sprout,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    authModalRolePreset,
    authModalNotice,
    closeAuthModal,
    login,
    register,
    quickDemoLogin,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'donor' | 'recipient'>('donor');
  const [organizationName, setOrganizationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');

  // Sync initial mode & presets when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      if (authModalRolePreset) {
        setRole(authModalRolePreset);
      }
      setError(null);
      setShowPassword(false);
    }
  }, [isAuthModalOpen, authModalMode, authModalRolePreset]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login({ email, password });
        if (!result.success) {
          setError(result.error || 'Failed to sign in. Please verify your credentials.');
        }
      } else {
        if (!email.trim() || !password || !organizationName.trim() || !contactName.trim()) {
          setError('Please fill in all required fields.');
          setIsSubmitting(false);
          return;
        }

        const result = await register({
          email: email.trim(),
          password,
          role,
          organizationName: organizationName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim() || undefined,
        });

        if (!result.success) {
          setError(result.error || 'Registration failed. Please check form inputs.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (selectedRole: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await quickDemoLogin(selectedRole);
      if (!res.success) {
        setError(res.error || 'Quick demo login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="sl-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <motion.div
          className="sl-modal-backdrop__bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
        />

        <motion.div
          className="sl-modal-panel sl-auth-modal"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="sl-auth-modal__header">
            <div className="sl-brand sl-auth-modal__brand">
              <span className="sl-brand__icon-box">
                <Sprout size={18} />
              </span>
              <span className="sl-brand__name">SurplusLabel</span>
            </div>

            <button
              type="button"
              className="sl-modal-close"
              onClick={closeAuthModal}
              aria-label="Close authentication dialog"
            >
              <X size={20} />
            </button>
          </div>

          <div className="sl-auth-modal__body">
            <h2 id="auth-modal-title" className="sl-auth-modal__title">
              {mode === 'login' ? 'Sign in to SurplusLabel' : 'Create an Organization Account'}
            </h2>
            <p className="sl-auth-modal__subtitle">
              {mode === 'login'
                ? 'Access your food listings, active reservations, and verified verification PINs.'
                : 'Join our trusted food rescue network as a donor or recipient charity.'}
            </p>

            {/* Contextual Notice */}
            {authModalNotice && (
              <div className="sl-auth-notice" role="alert">
                <AlertCircle size={16} className="sl-auth-notice__icon" />
                <span>{authModalNotice}</span>
              </div>
            )}

            {/* Quick Demo Login Preset Buttons */}
            <div className="sl-auth-quick-login">
              <span className="sl-auth-quick-login__label">One-Click Exhibition Demo Sign In:</span>
              <div className="sl-auth-quick-login__grid">
                <button
                  type="button"
                  className="sl-quick-btn sl-quick-btn--donor"
                  onClick={() => handleQuickLogin('donor')}
                  disabled={isSubmitting}
                  title="Sign in as GreenMarket Community Co-op (Donor)"
                >
                  <Sprout size={14} />
                  <span>Demo Donor</span>
                </button>

                <button
                  type="button"
                  className="sl-quick-btn sl-quick-btn--recipient"
                  onClick={() => handleQuickLogin('recipient')}
                  disabled={isSubmitting}
                  title="Sign in as Hope Community Food Pantry (Recipient)"
                >
                  <HeartHandshake size={14} />
                  <span>Demo Recipient</span>
                </button>

                <button
                  type="button"
                  className="sl-quick-btn sl-quick-btn--admin"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isSubmitting}
                  title="Sign in as Platform Oversight (Administrator)"
                >
                  <ShieldCheck size={14} />
                  <span>Demo Admin</span>
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="sl-auth-tabs" role="tablist" aria-label="Sign in or register">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={`sl-auth-tab ${mode === 'login' ? 'sl-auth-tab--active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={`sl-auth-tab ${mode === 'register' ? 'sl-auth-tab--active' : ''}`}
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
              >
                Register
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="sl-auth-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="sl-auth-form" noValidate>
              {/* Registration Specific Fields */}
              {mode === 'register' && (
                <>
                  {/* Role Selection */}
                  <div className="sl-form-group">
                    <label className="sl-form-label">
                      Organization Role <span className="sl-form-required">*</span>
                    </label>
                    <div className="sl-role-cards">
                      <button
                        type="button"
                        className={`sl-role-card ${role === 'donor' ? 'sl-role-card--active' : ''}`}
                        onClick={() => setRole('donor')}
                      >
                        <div className="sl-role-card__header">
                          <Sprout size={16} className="sl-role-card__icon" />
                          <strong className="sl-role-card__title">Food Donor</strong>
                        </div>
                        <p className="sl-role-card__desc">
                          Businesses, markets, farms, and mess halls donating surplus food batches.
                        </p>
                      </button>

                      <button
                        type="button"
                        className={`sl-role-card ${role === 'recipient' ? 'sl-role-card--active' : ''}`}
                        onClick={() => setRole('recipient')}
                      >
                        <div className="sl-role-card__header">
                          <HeartHandshake size={16} className="sl-role-card__icon" />
                          <strong className="sl-role-card__title">Recipient Charity</strong>
                        </div>
                        <p className="sl-role-card__desc">
                          Food rescue pantries, soup kitchens, and non-profits claiming surplus food.
                        </p>
                      </button>
                    </div>
                    <span className="sl-form-hint">
                      Administrative roles are provisioned by platform oversight and cannot be selected publicly.
                    </span>
                  </div>

                  {/* Organization Name */}
                  <div className="sl-form-group">
                    <label htmlFor="reg-org-name" className="sl-form-label">
                      Organization Name <span className="sl-form-required">*</span>
                    </label>
                    <div className="sl-input-wrapper">
                      <Building2 size={16} className="sl-input-icon" />
                      <input
                        id="reg-org-name"
                        type="text"
                        className="sl-input"
                        placeholder="e.g. Metro Food Hub, City Harvest Co-op"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Contact Name & Phone */}
                  <div className="sl-form-row">
                    <div className="sl-form-group">
                      <label htmlFor="reg-contact-name" className="sl-form-label">
                        Primary Contact Name <span className="sl-form-required">*</span>
                      </label>
                      <div className="sl-input-wrapper">
                        <UserIcon size={16} className="sl-input-icon" />
                        <input
                          id="reg-contact-name"
                          type="text"
                          className="sl-input"
                          placeholder="e.g. Jordan Smith"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="sl-form-group">
                      <label htmlFor="reg-phone" className="sl-form-label">
                        Phone Number
                      </label>
                      <div className="sl-input-wrapper">
                        <Phone size={16} className="sl-input-icon" />
                        <input
                          id="reg-phone"
                          type="tel"
                          className="sl-input"
                          placeholder="+1 (555) 012-3456"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="sl-form-group">
                <label htmlFor="auth-email" className="sl-form-label">
                  Email Address <span className="sl-form-required">*</span>
                </label>
                <div className="sl-input-wrapper">
                  <Mail size={16} className="sl-input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="sl-input"
                    placeholder="name@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="sl-form-group">
                <div className="sl-form-label-row">
                  <label htmlFor="auth-password" className="sl-form-label">
                    Password <span className="sl-form-required">*</span>
                  </label>
                  {mode === 'register' && (
                    <span className="sl-form-hint-inline">Min 8 chars, 1 letter, 1 number</span>
                  )}
                </div>
                <div className="sl-input-wrapper">
                  <Lock size={16} className="sl-input-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="sl-input sl-input--with-toggle"
                    placeholder={mode === 'register' ? 'Create a secure password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    className="sl-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="sl-btn sl-btn--primary sl-btn--md sl-btn--full sl-auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="sl-spinner" aria-hidden="true" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'login' ? (
                  <>
                    <KeyRound size={16} />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Register Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
