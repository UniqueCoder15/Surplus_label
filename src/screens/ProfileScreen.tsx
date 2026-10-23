import React, { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  // Dialog states
  const [activeDialog, setActiveDialog] = useState<'edit' | 'password' | 'help' | null>(null);

  // Edit Profile Form
  const [name, setName] = useState(user?.contactName || 'Drishti');
  const [org, setOrg] = useState(user?.organizationName || 'GreenMarket Community Co-op');
  const [phone, setPhone] = useState(user?.phone || '+1 (555) 234-5678');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Change Password Form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);

  const displayName = user?.contactName || 'Drishti';
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Donor';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice('Profile information updated successfully.');
    setTimeout(() => {
      setSavedNotice(null);
      setActiveDialog(null);
    }, 1000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    setSavedNotice('Password changed securely.');
    setTimeout(() => {
      setSavedNotice(null);
      setActiveDialog(null);
    }, 1000);
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('landing');
  };

  return (
    <div className="sl-profile-page-ref">
      <div className="sl-container sl-profile-container-ref">
        {/* Back Link */}
        <div className="sl-profile-back-bar-ref">
          <button
            type="button"
            className="sl-back-btn-ref"
            onClick={() => onNavigate('donor')}
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>

        {/* Centered Profile Card matching Reference Screen 10 */}
        <motion.div
          className="sl-profile-card-ref"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Card Title */}
          <h2 className="sl-profile-card-header-title-ref">Profile</h2>

          {/* Avatar Circle */}
          <div className="sl-profile-avatar-circle-ref">
            <span>{initial}</span>
          </div>

          {/* User Details */}
          <div className="sl-profile-user-info-ref">
            <h1 className="sl-profile-user-name-ref">{displayName}</h1>
            <span className="sl-profile-role-tag-ref">{displayRole}</span>
            {user?.email && (
              <p className="sl-profile-email-ref">{user.email}</p>
            )}
            {user?.organizationName && (
              <p className="sl-profile-org-ref">{user.organizationName}</p>
            )}
          </div>

          {/* Option Menu Items matching Reference */}
          <div className="sl-profile-menu-ref">
            <button
              type="button"
              className="sl-profile-menu-item-ref"
              onClick={() => setActiveDialog('edit')}
            >
              <div className="sl-profile-menu-left-ref">
                <UserIcon size={18} />
                <span>Edit Profile</span>
              </div>
              <ChevronRight size={18} className="sl-profile-chevron-ref" />
            </button>

            <button
              type="button"
              className="sl-profile-menu-item-ref"
              onClick={() => setActiveDialog('password')}
            >
              <div className="sl-profile-menu-left-ref">
                <Lock size={18} />
                <span>Change Password</span>
              </div>
              <ChevronRight size={18} className="sl-profile-chevron-ref" />
            </button>

            <button
              type="button"
              className="sl-profile-menu-item-ref"
              onClick={() => setActiveDialog('help')}
            >
              <div className="sl-profile-menu-left-ref">
                <HelpCircle size={18} />
                <span>Help & Support</span>
              </div>
              <ChevronRight size={18} className="sl-profile-chevron-ref" />
            </button>

            <button
              type="button"
              className="sl-profile-menu-item-ref sl-profile-menu-item-ref--logout"
              onClick={handleLogout}
            >
              <div className="sl-profile-menu-left-ref">
                <LogOut size={18} />
                <span>Logout</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Dialog */}
      <AnimatePresence>
        {activeDialog === 'edit' && (
          <div className="sl-modal-overlay-ref" onClick={() => setActiveDialog(null)}>
            <motion.div
              className="sl-modal-card-ref"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="sl-modal-header-ref">
                <h3>Edit Profile Information</h3>
                <button
                  type="button"
                  className="sl-modal-close-ref"
                  onClick={() => setActiveDialog(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {savedNotice && (
                <div className="sl-auth-success-banner-ref" role="status">
                  <CheckCircle2 size={16} />
                  <span>{savedNotice}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="sl-modal-form-ref">
                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">Contact Name</label>
                  <input
                    type="text"
                    className="sl-text-input-ref"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">Organization Name</label>
                  <input
                    type="text"
                    className="sl-text-input-ref"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    required
                  />
                </div>

                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">Contact Phone</label>
                  <input
                    type="text"
                    className="sl-text-input-ref"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="sl-modal-actions-ref">
                  <button
                    type="button"
                    className="sl-btn-ref sl-btn-ref--outline"
                    onClick={() => setActiveDialog(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sl-btn-ref sl-btn-ref--primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Dialog */}
      <AnimatePresence>
        {activeDialog === 'password' && (
          <div className="sl-modal-overlay-ref" onClick={() => setActiveDialog(null)}>
            <motion.div
              className="sl-modal-card-ref"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="sl-modal-header-ref">
                <h3>Change Password</h3>
                <button
                  type="button"
                  className="sl-modal-close-ref"
                  onClick={() => setActiveDialog(null)}
                >
                  <X size={20} />
                </button>
              </div>

              {passError && (
                <div className="sl-auth-error-banner-ref" role="alert">
                  <AlertCircle size={16} />
                  <span>{passError}</span>
                </div>
              )}

              {savedNotice && (
                <div className="sl-auth-success-banner-ref" role="status">
                  <CheckCircle2 size={16} />
                  <span>{savedNotice}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="sl-modal-form-ref">
                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">Current Password</label>
                  <input
                    type="password"
                    className="sl-text-input-ref"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                  />
                </div>

                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    className="sl-text-input-ref"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                  />
                </div>

                <div className="sl-form-field-ref">
                  <label className="sl-form-label-ref">Confirm New Password</label>
                  <input
                    type="password"
                    className="sl-text-input-ref"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>

                <div className="sl-modal-actions-ref">
                  <button
                    type="button"
                    className="sl-btn-ref sl-btn-ref--outline"
                    onClick={() => setActiveDialog(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="sl-btn-ref sl-btn-ref--primary">
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help & Support Dialog */}
      <AnimatePresence>
        {activeDialog === 'help' && (
          <div className="sl-modal-overlay-ref" onClick={() => setActiveDialog(null)}>
            <motion.div
              className="sl-modal-card-ref"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="sl-modal-header-ref">
                <h3>SurplusLabel Help & Coordination</h3>
                <button
                  type="button"
                  className="sl-modal-close-ref"
                  onClick={() => setActiveDialog(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="sl-help-content-ref">
                <p>
                  Welcome to SurplusLabel support! Our dispatch team is available 24/7 to coordinate
                  food pickups between hostels, retailers, and local community pantries.
                </p>

                <div className="sl-help-item-ref">
                  <strong>📞 Emergency Dispatch Hotline:</strong>
                  <span>+1 (800) 555-FOOD (3663)</span>
                </div>

                <div className="sl-help-item-ref">
                  <strong>✉️ Coordinator Email:</strong>
                  <span>support@surpluslabel.org</span>
                </div>

                <div className="sl-help-item-ref">
                  <strong>🛡️ Food Safety & Date Guidelines:</strong>
                  <span>
                    Packaged goods past "Best Before" can often be safely distributed. Items past
                    "Use By" or "Expiry" are handled under strict immediate distribution windows.
                  </span>
                </div>
              </div>

              <div className="sl-modal-actions-ref">
                <button
                  type="button"
                  className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--full"
                  onClick={() => setActiveDialog(null)}
                >
                  Close Help Center
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
