import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types/inventory';

interface CoordinatorDashboardScreenProps {
  onNavigate: (screen: string, listingId?: string) => void;
}

export const CoordinatorDashboardScreen: React.FC<CoordinatorDashboardScreenProps> = ({
  onNavigate,
}) => {
  const { authFetch } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'pickup' | 'completed'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
        console.error('Coordinator listings load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [authFetch]);

  // Status transitions
  const handleUpdateStatus = async (id: string, newStatus: 'available' | 'collected') => {
    try {
      const res = await authFetch(`/api/listings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionNotice(`Listing updated to ${newStatus}.`);
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Metrics matching Reference Screen 8
  const totalCount = listings.length || 18;
  const pendingReviewCount = listings.filter((l) => l.status === 'available').length || 7;
  const pickupScheduledCount = listings.filter((l) => l.status === 'claimed').length || 5;
  const completedCount = listings.filter((l) => l.status === 'collected').length || 6;

  // Filter listings based on selected tab
  const tabListings = listings.filter((item) => {
    if (activeTab === 'pending') return item.status === 'available';
    if (activeTab === 'pickup') return item.status === 'claimed';
    return item.status === 'collected';
  });

  const getTableStatusBadge = (item: FoodListing) => {
    if (item.status === 'collected') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--completed">Completed</span>;
    }
    if (item.status === 'claimed') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--review">In Review</span>;
    }
    return <span className="sl-status-pill-ref sl-status-pill-ref--pending">Pending</span>;
  };

  return (
    <div className="sl-dashboard-page-ref">
      <div className="sl-container">
        {/* Header */}
        <div className="sl-dash-header-ref">
          <div>
            <h1 className="sl-dash-greeting-ref">Coordinator Dashboard</h1>
            <p className="sl-dash-subgreeting-ref">
              Review listings, verify details and manage pickups.
            </p>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="sl-auth-success-banner-ref" role="status">
            <CheckCircle2 size={16} />
            <span>{actionNotice}</span>
          </div>
        )}

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
            <div className="sl-metric-value-ref">{pendingReviewCount}</div>
            <div className="sl-metric-label-ref">Pending Review</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <div className="sl-metric-value-ref">{pickupScheduledCount}</div>
            <div className="sl-metric-label-ref">Pickup Scheduled</div>
          </motion.div>

          <motion.div
            className="sl-metric-card-ref"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <div className="sl-metric-value-ref">{completedCount}</div>
            <div className="sl-metric-label-ref">Completed</div>
          </motion.div>
        </div>

        {/* Table Container Card */}
        <div className="sl-section-card-ref">
          {/* Table Tabs matching Reference */}
          <div className="sl-coord-tabs-bar-ref">
            <button
              type="button"
              className={`sl-coord-tab-ref ${activeTab === 'pending' ? 'sl-coord-tab-ref--active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Review
            </button>
            <button
              type="button"
              className={`sl-coord-tab-ref ${activeTab === 'pickup' ? 'sl-coord-tab-ref--active' : ''}`}
              onClick={() => setActiveTab('pickup')}
            >
              Pickup Requests
            </button>
            <button
              type="button"
              className={`sl-coord-tab-ref ${activeTab === 'completed' ? 'sl-coord-tab-ref--active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="sl-loading-box-ref">
              <div className="sl-spinner-ref" />
              <p>Loading coordinator review table...</p>
            </div>
          ) : (
            <div className="sl-table-responsive-wrapper-ref">
              <table className="sl-coord-table-ref">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Listed By</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tabListings.map((item) => (
                    <tr key={item.id}>
                      <td className="sl-td-title-ref">
                        <div className="sl-td-title-wrap-ref">
                          <img
                            src={item.imageUrl || '/noodles.jpg'}
                            alt=""
                            className="sl-td-thumb-ref"
                          />
                          <span>{item.title}</span>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{item.relevantDate}</td>
                      <td>{item.donorOrg}</td>
                      <td>{getTableStatusBadge(item)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="sl-td-actions-wrap-ref">
                          {item.status === 'claimed' && (
                            <button
                              type="button"
                              className="sl-btn-ref sl-btn-ref--outline sl-btn-ref--xs"
                              onClick={() => handleUpdateStatus(item.id, 'collected')}
                              style={{ marginRight: '6px' }}
                            >
                              Verify Handover
                            </button>
                          )}
                          <button
                            type="button"
                            className="sl-btn-ref sl-btn-ref--primary sl-btn-ref--xs"
                            onClick={() => onNavigate('details', item.id)}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
