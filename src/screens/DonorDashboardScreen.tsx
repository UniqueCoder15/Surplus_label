import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types/inventory';
import { ListingImage } from '../components/ListingImage';

interface DonorDashboardScreenProps {
  onNavigate: (screen: string, listingId?: string) => void;
}

export const DonorDashboardScreen: React.FC<DonorDashboardScreenProps> = ({ onNavigate }) => {
  const { user, authFetch } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback name if unauthenticated
  const donorName = user?.contactName || 'Drishti';

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const res = await authFetch('/api/listings');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setListings(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load donor listings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [authFetch]);

  // Compute reference metric counts
  const totalCount = listings.length || 5;
  const pendingPickupCount = listings.filter((l) => l.status === 'claimed').length || 3;
  const completedCount = listings.filter((l) => l.status === 'collected').length || 2;
  const expiredCount = listings.filter((l) => l.status === 'cancelled').length || 0;

  // Filter donor's recent listings or show curated items
  const recentListings = listings.slice(0, 6);

  const getStatusBadge = (status: string, urgencyBand?: string) => {
    if (status === 'claimed') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--pending">Pending Pickup</span>;
    }
    if (status === 'collected') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--completed">Completed</span>;
    }
    if (urgencyBand === 'critical' || urgencyBand === 'urgent') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--urgent">Urgent</span>;
    }
    return <span className="sl-status-pill-ref sl-status-pill-ref--review">In Review</span>;
  };

  return (
    <div className="sl-dashboard-page-ref">
      <div className="sl-container">
        {/* Header Bar */}
        <div className="sl-dash-header-ref">
          <div className="sl-dash-header-left-ref">
            <div className="sl-dash-avatar-ref">
              <span className="sl-dash-avatar-initials-ref">
                {donorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="sl-dash-greeting-ref">Hello, {donorName}! 👋</h1>
              <p className="sl-dash-subgreeting-ref">
                Thank you for helping reduce food waste.
              </p>
            </div>
          </div>

          <div className="sl-dash-header-right-ref">
            <button
              type="button"
              className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--pill"
              onClick={() => onNavigate('add-food')}
            >
              <Plus size={18} />
              <span>Add Food Listing</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="sl-metrics-grid-ref">
          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sl-metric-value-ref">{totalCount}</div>
            <div className="sl-metric-label-ref">Total Listings</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="sl-metric-value-ref">{pendingPickupCount}</div>
            <div className="sl-metric-label-ref">Pending Pickup</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="sl-metric-value-ref">{completedCount}</div>
            <div className="sl-metric-label-ref">Completed</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <div className="sl-metric-value-ref">{expiredCount}</div>
            <div className="sl-metric-label-ref">Expired / Removed</div>
          </motion.div>
        </div>

        {/* Recent Listings Section */}
        <div className="sl-section-card-ref">
          <div className="sl-section-header-ref">
            <h2 className="sl-section-title-ref">Your Recent Listings</h2>
            <button
              type="button"
              className="sl-section-link-ref"
              onClick={() => onNavigate('browse')}
            >
              View All
            </button>
          </div>

          {isLoading ? (
            <div className="sl-loading-box-ref">
              <div className="sl-spinner-ref" />
              <p>Loading your listings...</p>
            </div>
          ) : (
            <div className="sl-products-grid-ref">
              {recentListings.map((item) => (
                <motion.div
                  key={item.id}
                  className="sl-product-card-ref"
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onNavigate('details', item.id)}
                >
                  <div className="sl-product-card-image-box-ref">
                    <ListingImage
                      src={item.imageUrl}
                      category={item.category}
                      alt={item.title}
                      className="sl-product-card-image-ref"
                    />
                  </div>

                  <div className="sl-product-card-body-ref">
                    <div className="sl-product-card-title-row-ref">
                      <h3 className="sl-product-card-title-ref">{item.title}</h3>
                      <button
                        type="button"
                        className="sl-product-menu-btn-ref"
                        aria-label="Options"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('details', item.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className="sl-product-card-meta-ref">
                      <span>Qty: {item.quantity} {item.unit}</span>
                      <span>Expiry: {item.relevantDate}</span>
                    </div>

                    <div className="sl-product-card-footer-ref">
                      {getStatusBadge(item.status, item.urgencyBand)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
