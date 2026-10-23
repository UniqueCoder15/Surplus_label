import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppHeader } from './components/AppHeader';
import { ReferenceScreenSwitcher } from './components/ReferenceScreenSwitcher';
import { LandingScreen } from './screens/LandingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { DonorDashboardScreen } from './screens/DonorDashboardScreen';
import { AddFoodScreen } from './screens/AddFoodScreen';
import { BrowseFoodScreen } from './screens/BrowseFoodScreen';
import { ListingDetailsScreen } from './screens/ListingDetailsScreen';
import { RecipientDashboardScreen } from './screens/RecipientDashboardScreen';
import { CoordinatorDashboardScreen } from './screens/CoordinatorDashboardScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ClaimDonationModal } from './components/ClaimDonationModal';
import { DemoModal } from './components/DemoModal';
import { FoodListing } from './types/inventory';
import './App.css';

export const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('landing');
  const [selectedListingId, setSelectedListingId] = useState<string | undefined>(undefined);
  const [claimingListing, setClaimingListing] = useState<FoodListing | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Exhibition interactive demo modal
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoRole, setDemoRole] = useState<'donor' | 'recipient' | 'coordinator'>('donor');
  const [donorMode, setDonorMode] = useState<'upload' | 'simulate'>('simulate');

  // Sync hash on initial load & popstate
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (!hash) {
        setCurrentScreen('landing');
        return;
      }

      // Check if hash is of form details/:id or listing/:id
      if (hash.startsWith('details/') || hash.startsWith('listing/')) {
        const id = hash.split('/')[1];
        setSelectedListingId(id);
        setCurrentScreen('details');
        return;
      }

      const validScreens = [
        'landing',
        'auth',
        'donor',
        'add-food',
        'browse',
        'details',
        'recipient',
        'coordinator',
        'notifications',
        'profile',
      ];

      if (validScreens.includes(hash)) {
        setCurrentScreen(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (screen: string, listingId?: string) => {
    if (listingId) {
      setSelectedListingId(listingId);
      window.location.hash = `#/${screen}/${listingId}`;
    } else {
      window.location.hash = `#/${screen}`;
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenClaimModal = (listing: FoodListing) => {
    setClaimingListing(listing);
    setIsClaimModalOpen(true);
  };

  const handleClaimSuccess = (_updatedListing: FoodListing) => {
    setIsClaimModalOpen(false);
    setClaimingListing(null);
    handleNavigate('recipient');
  };

  const handleOpenDemo = (
    role: 'donor' | 'recipient' | 'coordinator' = 'donor',
    mode: 'upload' | 'simulate' = 'simulate'
  ) => {
    setDemoRole(role);
    setDonorMode(mode);
    setIsDemoOpen(true);
  };

  return (
    <div className="sl-app">
      {/* Screen Reader Skip Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Top Application Header */}
      <AppHeader
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenDemo={handleOpenDemo}
      />

      {/* Main Content Area Rendering Current Screen */}
      <main id="main-content" className="sl-main">
        {currentScreen === 'landing' && (
          <LandingScreen
            onNavigate={handleNavigate}
            onOpenDemo={handleOpenDemo}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'donor' && (
          <DonorDashboardScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'add-food' && (
          <AddFoodScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'browse' && (
          <BrowseFoodScreen
            onNavigate={handleNavigate}
            onOpenClaimModal={handleOpenClaimModal}
          />
        )}

        {currentScreen === 'details' && (
          <ListingDetailsScreen
            listingId={selectedListingId}
            onNavigate={handleNavigate}
            onOpenClaimModal={handleOpenClaimModal}
          />
        )}

        {currentScreen === 'recipient' && (
          <RecipientDashboardScreen
            onNavigate={handleNavigate}
            onOpenClaimModal={handleOpenClaimModal}
          />
        )}

        {currentScreen === 'coordinator' && (
          <CoordinatorDashboardScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'notifications' && (
          <NotificationsScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen onNavigate={handleNavigate} />
        )}
      </main>

      {/* Bottom Floating Reference Screen Switcher for Immediate Evaluation */}
      <ReferenceScreenSwitcher
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
      />

      {/* Claim Donation Modal */}
      <ClaimDonationModal
        listing={claimingListing}
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimingListing(null);
        }}
        onClaimSuccess={handleClaimSuccess}
      />

      {/* Interactive Exhibition Demo Walkthrough Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        initialRole={demoRole}
        initialDonorMode={donorMode}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
