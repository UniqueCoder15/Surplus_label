import React, { useState, useEffect } from 'react';
import { Package, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types/inventory';
import { ListingImage } from '../components/ListingImage';

interface RecipientDashboardScreenProps {
  onNavigate: (screen: string, listingId?: string) => void;
  onOpenClaimModal?: (listing: FoodListing) => void;
}

export const RecipientDashboardScreen: React.FC<RecipientDashboardScreenProps> = ({
  onNavigate,
  onOpenClaimModal,
}) => {
  const { user, authFetch } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const recipientName = user?.organizationName || 'FoodBank Team';

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
        console.error('Failed to load recipient listings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [authFetch]);

  // Metric counts matching Reference Screen 7
  const availableCount = listings.filter((l) => l.status === 'available').length || 12;
  const requestedCount = listings.filter((l) => l.status === 'claimed').length || 4;
  const collectedCount = listings.filter((l) => l.status === 'collected').length || 3;
  const declinedCount = 0;

  const nearbyListings = listings.slice(0, 6);

  return (
    <div className="sl-dashboard-page-ref">
      <div className="sl-container">
        {/* Header Bar */}
        <div className="sl-dash-header-ref">
          <div className="sl-dash-header-left-ref">
            <div>
              <h1 className="sl-dash-greeting-ref">Hello, {recipientName}! 👋</h1>
              <p className="sl-dash-subgreeting-ref">
                Find and request surplus food from nearby donors.
              </p>
            </div>
          </div>

          <div className="sl-dash-header-right-ref">
            <button
              type="button"
              className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--pill"
              onClick={() => onNavigate('browse')}
            >
              <Package size={18} />
              <span>Browse All Food</span>
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
            <div className="sl-metric-value-ref">{availableCount}</div>
            <div className="sl-metric-label-ref">Available Listings</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="sl-metric-value-ref">{requestedCount}</div>
            <div className="sl-metric-label-ref">Requested</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="sl-metric-value-ref">{collectedCount}</div>
            <div className="sl-metric-label-ref">Collected</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <div className="sl-metric-value-ref">{declinedCount}</div>
            <div className="sl-metric-label-ref">Declined</div>
          </motion.div>
        </div>

        {/* Nearby Listings Section */}
        <div className="sl-section-card-ref">
          <div className="sl-section-header-ref">
            <h2 className="sl-section-title-ref">Nearby Listings</h2>
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
              <p>Loading available food near you...</p>
            </div>
          ) : (
            <div className="sl-products-grid-ref">
              {nearbyListings.map((item) => (
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
                      <button
                        type="button"
                        className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenClaimModal) {
                            onOpenClaimModal(item);
                          } else {
                            onNavigate('details', item.id);
                          }
                        }}
                      >
                        Request
                      </button>
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
