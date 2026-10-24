import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface AuthScreenProps {
  onNavigate: (screen: string) => void;
  initialMode?: 'login' | 'register';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate, initialMode = 'register' }) => {
  const { login, register, quickDemoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<'donor' | 'recipient' | 'coordinator'>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (selectedRole === 'coordinator') {
        setError('Coordinator accounts require platform administrator approval. Use the pre-seeded Demo Coordinator to sign in.');
        return;
      }

      setIsSubmitting(true);
      const res = await register({
        contactName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole as 'donor' | 'recipient',
        organizationName: `${name.trim()}'s Food Initiative`,
      });
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting...');
        setTimeout(() => {
          if (selectedRole === 'donor') onNavigate('donor');
          else onNavigate('recipient');
        }, 600);
      } else {
        setError(res.error || 'Failed to register account.');
      }
    } else {
      // Login
      if (!email.trim() || !password) {
        setError('Please enter your email and password.');
        return;
      }

      setIsSubmitting(true);
      const res = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => {
          if (selectedRole === 'donor') onNavigate('donor');
          else if (selectedRole === 'coordinator') onNavigate('coordinator');
          else onNavigate('recipient');
        }, 600);
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    const res = await quickDemoLogin(role);
    setIsSubmitting(false);
    if (res.success) {
      if (role === 'donor') onNavigate('donor');
      else if (role === 'admin') onNavigate('coordinator');
      else onNavigate('recipient');
    } else {
      setError(res.error || 'Quick demo login failed.');
    }
  };

  return (
    <div className="sl-auth-page-ref">
      <div className="sl-auth-container-ref">
        {/* Left Form Card */}
        <motion.div
          className="sl-auth-card-ref"
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo & Header */}
          <div className="sl-auth-header-ref">
            <div className="sl-auth-logo-ref" onClick={() => onNavigate('landing')} role="button" tabIndex={0} aria-label="SurplusLabel Home">
              <picture>
                <source media="(max-width: 480px)" srcSet="/logo-compact.png" />
                <img
                  src="/logo.png"
                  alt="SurplusLabel — Good Food. Less Waste."
                  className="sl-auth-logo-img-ref"
                />
              </picture>
            </div>
            <h1 className="sl-auth-title-ref">
              {mode === 'register' ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="sl-auth-subtitle-ref">
              Join us to reduce food waste and make an impact.
            </p>
          </div>

          {/* Role Pill Switcher */}
          <div className="sl-role-pill-group-ref" role="radiogroup" aria-label="Account Role">
            <button
              type="button"
              className={`sl-role-pill-ref ${selectedRole === 'donor' ? 'sl-role-pill-ref--active' : ''}`}
              onClick={() => setSelectedRole('donor')}
            >
              Donor
            </button>
            <button
              type="button"
              className={`sl-role-pill-ref ${selectedRole === 'recipient' ? 'sl-role-pill-ref--active' : ''}`}
              onClick={() => setSelectedRole('recipient')}
            >
              Recipient
            </button>
            <button
              type="button"
              className={`sl-role-pill-ref ${selectedRole === 'coordinator' ? 'sl-role-pill-ref--active' : ''}`}
              onClick={() => setSelectedRole('coordinator')}
            >
              Coordinator
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="sl-auth-error-banner-ref" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="sl-auth-success-banner-ref" role="status">
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="sl-auth-form-ref">
            {mode === 'register' && (
              <div className="sl-auth-input-group-ref">
                <span className="sl-auth-input-icon-ref">
                  <UserIcon size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Name"
                  className="sl-auth-input-ref"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="sl-auth-input-group-ref">
              <span className="sl-auth-input-icon-ref">
                <Mail size={18} />
              </span>
              <input
                type="email"
                placeholder="Email"
                className="sl-auth-input-ref"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="sl-auth-input-group-ref">
              <span className="sl-auth-input-icon-ref">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="sl-auth-input-ref"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="sl-auth-eye-btn-ref"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === 'register' && (
              <div className="sl-auth-input-group-ref">
                <span className="sl-auth-input-icon-ref">
                  <Lock size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  className="sl-auth-input-ref"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="sl-auth-eye-btn-ref"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : mode === 'register'
                ? 'Sign Up'
                : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Presets */}
          <div className="sl-auth-demo-presets-ref">
            <span className="sl-auth-demo-label-ref">Quick Demo Access:</span>
            <div className="sl-auth-demo-chips-ref">
              <button
                type="button"
                className="sl-demo-chip-ref sl-demo-chip-ref--donor"
                onClick={() => handleQuickDemo('donor')}
              >
                Donor (GreenMarket)
              </button>
              <button
                type="button"
                className="sl-demo-chip-ref sl-demo-chip-ref--recipient"
                onClick={() => handleQuickDemo('recipient')}
              >
                Recipient (FoodPantry)
              </button>
              <button
                type="button"
                className="sl-demo-chip-ref sl-demo-chip-ref--admin"
                onClick={() => handleQuickDemo('admin')}
              >
                Coordinator (Admin)
              </button>
            </div>
          </div>

          {/* Switch Mode Link */}
          <div className="sl-auth-footer-ref">
            {mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="sl-auth-switch-btn-ref"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                >
                  Sign In Instead
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="sl-auth-switch-btn-ref"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                >
                  Create an Account
                </button>
              </p>
            )}
          </div>
        </motion.div>

        {/* Right Promotional Panel */}
        <motion.div
          className="sl-auth-banner-ref"
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="sl-auth-banner-inner-ref">
            <div className="sl-auth-banner-image-box-ref">
              <img
                src="/volunteer-hero.jpg"
                alt="Volunteer smiling and holding box of rescued groceries"
                className="sl-auth-banner-image-ref"
              />
            </div>
            <h2 className="sl-auth-banner-slogan-ref">
              Good food <br />
              should reach people, <br />
              not landfills.
            </h2>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
