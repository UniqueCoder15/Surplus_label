import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Package,
  Clock,
  HeartHandshake,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Eye,
  X,
  PackageOpen,
  Sprout,
  KeyRound,
} from 'lucide-react';
import {
  FoodListing,
  ListingMetrics,
  ListingStatus,
} from '../types/inventory';
import { formatDisplayDate } from '../utils/ocrDateParser';
import { CreateListingModal } from './CreateListingModal';
import { ListingDetailsModal } from './ListingDetailsModal';
import { ClaimDonationModal } from './ClaimDonationModal';
import { useAuth } from '../context/AuthContext';

interface InventoryDashboardProps {
  onOpenCreateListing?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = () => {
  const { user, openAuthModal, authFetch } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [metrics, setMetrics] = useState<ListingMetrics>({
    totalListings: 0,
    availableQuantity: 0,
    urgentListings: 0,
    claimedListings: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'date' | 'quantity' | 'createdAt'>('urgency');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch listings from backend
  const fetchListings = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedUrgency !== 'all') params.append('urgency', selectedUrgency);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('sortBy', sortBy);

      const response = await authFetch(`/api/listings?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to load listings (${response.status})`);
      }

      const data = await response.json();
      if (data.success) {
        setListings(data.data);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        throw new Error(data.error || 'Server reported failure loading food listings.');
      }
    } catch (err: any) {
      console.error('Fetch listings error:', err);
      setErrorMessage(err.message || 'Network error fetching food inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedUrgency, selectedStatus, sortBy, user]);

  // Handle created listing
  const handleListingCreated = (newListing: FoodListing) => {
    showToast(`Food listing "${newListing.title}" successfully published!`, 'success');
    fetchListings();
  };

  // Handle claim success
  const handleClaimSuccess = (updatedListing: FoodListing) => {
    showToast(
      `Reservation confirmed for ${updatedListing.claim?.recipientOrg}! Handover PIN: ${updatedListing.claim?.verificationPin}`,
      'success'
    );
    fetchListings();
  };

  // Handle status update
  const handleStatusUpdate = async (id: string, newStatus: ListingStatus, notes?: string) => {
    const res = await authFetch(`/api/listings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update status.');
    }

    showToast(`Listing status updated to ${newStatus}.`, 'success');
    fetchListings();
    if (selectedListing && selectedListing.id === id) {
      setSelectedListing(data.data);
    }
  };

  // Role-enforced action gates
  const handleAddListingClick = () => {
    if (!user) {
      openAuthModal('login', 'donor', 'Adding a food listing requires a verified Food Donor account.');
      return;
    }
    if (user.role === 'recipient') {
      showToast('Your account is registered as a Recipient Charity. Only Food Donors can add inventory.', 'warning');
      return;
    }
    setIsCreateOpen(true);
  };

  const handleOpenClaimClick = (listing: FoodListing) => {
    if (!user) {
      setSelectedListing(listing);
      openAuthModal('login', 'recipient', 'Claiming surplus food requires an authenticated Recipient Charity account.');
      return;
    }
    if (user.role === 'donor') {
      showToast('Food Donors cannot claim listings. Please sign in as a Recipient Charity.', 'warning');
      return;
    }
    setSelectedListing(listing);
    setIsClaimOpen(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedUrgency('all');
    setSelectedStatus('all');
    setSortBy('urgency');
  };

  return (
    <div className="sl-inventory-dashboard">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`sl-toast sl-toast--${toastMessage.type}`} role="status">
          {toastMessage.type === 'success' && <CheckCircle2 size={18} className="sl-text-success" />}
          {toastMessage.type === 'warning' && <AlertTriangle size={18} className="sl-text-warning" />}
          {toastMessage.type === 'info' && <Clock size={18} className="sl-text-primary" />}
          <span className="sl-toast__text">{toastMessage.text}</span>
          <button
            type="button"
            className="sl-toast__close"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss toast"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="sl-container">
        {/* Organization & Access Control Banner */}
        <div className="sl-auth-status-banner">
          {user ? (
            <div className="sl-auth-status-banner__inner">
              <span className={`sl-role-badge sl-role-badge--${user.role}`}>
                {user.role === 'donor' && <Sprout size={12} />}
                {user.role === 'recipient' && <HeartHandshake size={12} />}
                {user.role === 'admin' && <ShieldCheck size={12} />}
                <span>{user.role.toUpperCase()}</span>
              </span>
              <span className="sl-auth-status-banner__text">
                Operating as <strong>{user.organizationName}</strong> ({user.contactName})
              </span>
              {user.role === 'donor' && (
                <span className="sl-auth-status-banner__hint">• Authorized to publish surplus batches &amp; confirm handover</span>
              )}
              {user.role === 'recipient' && (
                <span className="sl-auth-status-banner__hint">• Authorized to reserve batches &amp; access handover PINs</span>
              )}
              {user.role === 'admin' && (
                <span className="sl-auth-status-banner__hint">• Platform Administrator Access</span>
              )}
            </div>
          ) : (
            <div className="sl-auth-status-banner__inner sl-auth-status-banner__inner--guest">
              <span className="sl-badge sl-badge--neutral sl-badge--sm">Guest View</span>
              <span className="sl-auth-status-banner__text">
                Browsing public inventory. Sign in as a Food Donor to publish batches, or as a Recipient Charity to reserve donations.
              </span>
              <button
                type="button"
                className="sl-btn sl-btn--subtle sl-btn--xs"
                onClick={() => openAuthModal('login')}
              >
                <KeyRound size={12} />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>

        {/* Top Header & Primary CTA */}
        <div className="sl-dashboard-header">
          <div className="sl-dashboard-header__info">
            <span className="sl-badge sl-badge--primary sl-badge--sm">Food Rescue Command</span>
            <h1 className="sl-dashboard-title">Surplus Food Inventory & Donation Triage</h1>
            <p className="sl-dashboard-subtitle">
              Verify packaging dates with OCR, monitor expiration urgency, and coordinate immediate
              donation claims with local food banks.
            </p>
          </div>
          <div className="sl-dashboard-header__actions">
            <button
              type="button"
              className="sl-btn sl-btn--subtle sl-btn--md"
              onClick={fetchListings}
              disabled={isLoading}
              title="Refresh inventory"
            >
              <RefreshCw size={16} className={isLoading ? 'sl-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="sl-btn sl-btn--primary sl-btn--md sl-dashboard-add-btn"
              onClick={handleAddListingClick}
            >
              <Plus size={18} />
              <span>Add Food Listing</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Row */}
        <div className="sl-metrics-grid">
          <div className="sl-metric-card">
            <div className="sl-metric-card__header">
              <span className="sl-metric-card__title">Total Listings</span>
              <span className="sl-metric-card__icon-box sl-metric-card__icon-box--primary">
                <Package size={18} />
              </span>
            </div>
            <div className="sl-metric-card__value">{metrics.totalListings}</div>
            <p className="sl-metric-card__footnote">Logged across campus and retail partner hubs</p>
          </div>

          <div className="sl-metric-card">
            <div className="sl-metric-card__header">
              <span className="sl-metric-card__title">Available Quantity</span>
              <span className="sl-metric-card__icon-box sl-metric-card__icon-box--success">
                <ShieldCheck size={18} />
              </span>
            </div>
            <div className="sl-metric-card__value">{metrics.availableQuantity}</div>
            <p className="sl-metric-card__footnote">Units / packs unreserved & ready for pickup</p>
          </div>

          <div className="sl-metric-card sl-metric-card--urgent">
            <div className="sl-metric-card__header">
              <span className="sl-metric-card__title">Urgent Triage (&lt;48h)</span>
              <span className="sl-metric-card__icon-box sl-metric-card__icon-box--danger">
                <Clock size={18} />
              </span>
            </div>
            <div className="sl-metric-card__value sl-text-danger">{metrics.urgentListings}</div>
            <p className="sl-metric-card__footnote">Requires priority food bank pickup</p>
          </div>

          <div className="sl-metric-card">
            <div className="sl-metric-card__header">
              <span className="sl-metric-card__title">Reserved / Claimed</span>
              <span className="sl-metric-card__icon-box sl-metric-card__icon-box--warning">
                <HeartHandshake size={18} />
              </span>
            </div>
            <div className="sl-metric-card__value">{metrics.claimedListings}</div>
            <p className="sl-metric-card__footnote">Awaiting collection window</p>
          </div>
        </div>

        {/* Search, Filter & Sort Controls Toolbar */}
        <div className="sl-inventory-toolbar">
          {/* Search Input */}
          <div className="sl-search-box">
            <Search size={16} className="sl-search-box__icon" />
            <input
              type="text"
              className="sl-search-box__input"
              placeholder="Search by food name, donor organization, or pickup location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search food inventory"
            />
            {searchQuery && (
              <button
                type="button"
                className="sl-search-box__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="sl-filter-controls">
            {/* Category Filter */}
            <div className="sl-select-wrap">
              <select
                className="sl-toolbar-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="bakery">Bakery & Bread</option>
                <option value="dairy">Dairy & Eggs</option>
                <option value="produce">Fresh Produce</option>
                <option value="pantry_grains">Pantry & Grains</option>
                <option value="canned_packaged">Canned / Packaged</option>
                <option value="prepared_meals">Prepared Meals</option>
                <option value="beverages">Beverages</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div className="sl-select-wrap">
              <select
                className="sl-toolbar-select"
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                aria-label="Filter by urgency"
              >
                <option value="all">All Urgency Bands</option>
                <option value="critical">Critical (&lt;24h)</option>
                <option value="urgent">Urgent (1–2 days)</option>
                <option value="soon">Soon (3–7 days)</option>
                <option value="normal">Normal (Stable)</option>
                <option value="past_best_before">Past Best-Before</option>
                <option value="past">Past Expiry</option>
                <option value="non_expiry">Production / Non-Expiry</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sl-select-wrap">
              <select
                className="sl-toolbar-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by listing status"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="claimed">Reserved / Claimed</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sorting */}
            <div className="sl-select-wrap">
              <select
                className="sl-toolbar-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort listings"
              >
                <option value="urgency">Sort: Urgency Priority</option>
                <option value="date">Sort: Soonest Date</option>
                <option value="quantity">Sort: Highest Quantity</option>
                <option value="createdAt">Sort: Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="sl-error-banner" role="alert">
            <AlertTriangle size={20} className="sl-text-danger sl-flex-shrink-0" />
            <div className="sl-flex-between sl-w-full">
              <div>
                <strong className="sl-block">Failed to load inventory</strong>
                <p className="sl-error-banner__message">{errorMessage}</p>
              </div>
              <button
                type="button"
                className="sl-btn sl-btn--sm sl-btn--danger"
                onClick={fetchListings}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="sl-table-skeleton-container" aria-busy="true">
            <div className="sl-skeleton sl-skeleton--header" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="sl-skeleton sl-skeleton--row" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && listings.length === 0 && (
          <div className="sl-empty-state-card">
            <div className="sl-empty-state-card__icon-box">
              <PackageOpen size={48} className="sl-text-muted" />
            </div>
            <h3 className="sl-empty-state-card__title">No surplus food listings found</h3>
            <p className="sl-empty-state-card__desc">
              {searchQuery ||
              selectedCategory !== 'all' ||
              selectedUrgency !== 'all' ||
              selectedStatus !== 'all'
                ? 'No active food listings match your current filters. Try resetting or adjusting criteria.'
                : 'No surplus items are currently recorded. Log the first surplus batch to begin coordination.'}
            </p>
            <div className="sl-empty-state-card__actions">
              {searchQuery ||
              selectedCategory !== 'all' ||
              selectedUrgency !== 'all' ||
              selectedStatus !== 'all' ? (
                <button
                  type="button"
                  className="sl-btn sl-btn--subtle"
                  onClick={handleResetFilters}
                >
                  Reset All Filters
                </button>
              ) : null}
              <button
                type="button"
                className="sl-btn sl-btn--primary"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={16} />
                <span>Log New Surplus Food</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Data Table (>= 768px) */}
        {!isLoading && !errorMessage && listings.length > 0 && (
          <>
            <div className="sl-table-responsive-wrapper">
              <table className="sl-inventory-table" role="table">
                <thead>
                  <tr>
                    <th scope="col" className="sl-th-product">Product & Packaging</th>
                    <th scope="col">Category</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Storage</th>
                    <th scope="col">Packaging Date</th>
                    <th scope="col">Urgency Triage</th>
                    <th scope="col">Verification</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="sl-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((item) => {
                    const isCritical = item.urgencyBand === 'critical';
                    const badgeVariant = item.urgencyBadgeVariant || 'neutral';

                    return (
                      <tr
                        key={item.id}
                        className={`sl-tr ${isCritical ? 'sl-tr--critical' : ''}`}
                      >
                        {/* Product Image & Title */}
                        <td className="sl-td-product">
                          <div className="sl-product-cell">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="sl-product-thumb"
                                loading="lazy"
                              />
                            ) : (
                              <div className="sl-product-thumb-placeholder">
                                <Package size={16} className="sl-text-muted" />
                              </div>
                            )}
                            <div className="sl-product-cell__info">
                              <div className="sl-flex-align-center" style={{ gap: 6 }}>
                                <span className="sl-product-cell__title">{item.title}</span>
                                {user && item.donorUserId === user.id && (
                                  <span className="sl-role-badge sl-role-badge--donor" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>Your Batch</span>
                                )}
                                {user && item.claim?.recipientUserId === user.id && (
                                  <span className="sl-role-badge sl-role-badge--recipient" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>Claimed by You</span>
                                )}
                              </div>
                              <span className="sl-product-cell__donor">
                                <Building2 size={12} /> {item.donorOrg}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className="sl-badge sl-badge--subtle sl-capitalize">
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Quantity */}
                        <td>
                          <span className="sl-font-semibold">
                            {item.quantity} {item.unit}
                          </span>
                        </td>

                        {/* Storage Condition */}
                        <td>
                          <span className="sl-capitalize sl-text-secondary sl-text-sm">
                            {item.storageCondition}
                          </span>
                        </td>

                        {/* Packaging Date */}
                        <td>
                          <div className="sl-date-cell">
                            <span className="sl-font-medium">
                              {formatDisplayDate(item.relevantDate)}
                            </span>
                            <span className="sl-text-xs sl-text-muted sl-capitalize">
                              {item.dateType.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        {/* Urgency */}
                        <td>
                          <span className={`sl-badge sl-badge--${badgeVariant}`}>
                            {item.urgencyLabel}
                          </span>
                        </td>

                        {/* Verification Status */}
                        <td>
                          <span className="sl-badge sl-badge--success sl-badge--sm">
                            <ShieldCheck size={13} />
                            <span>Verified</span>
                          </span>
                        </td>

                        {/* Listing Status */}
                        <td>
                          <span
                            className={`sl-badge sl-badge--status sl-badge--status-${item.status}`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="sl-td-actions">
                          <div className="sl-action-group">
                            <button
                              type="button"
                              className="sl-btn sl-btn--icon-sm sl-btn--subtle"
                              title="Inspect listing and audit details"
                              onClick={() => {
                                setSelectedListing(item);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye size={15} />
                            </button>
                            {item.status === 'available' ? (
                              <button
                                type="button"
                                className="sl-btn sl-btn--sm sl-btn--primary"
                                onClick={() => handleOpenClaimClick(item)}
                              >
                                <span>Reserve</span>
                              </button>
                            ) : item.status === 'claimed' ? (
                              <button
                                type="button"
                                className="sl-btn sl-btn--sm sl-btn--subtle"
                                onClick={() => {
                                  setSelectedListing(item);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <span>Details</span>
                              </button>
                            ) : (
                              <span className="sl-text-xs sl-text-muted sl-capitalize">
                                {item.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards Layout (< 768px) */}
            <div className="sl-mobile-cards-grid">
              {listings.map((item) => {
                const isCritical = item.urgencyBand === 'critical';
                const badgeVariant = item.urgencyBadgeVariant || 'neutral';

                return (
                  <div
                    key={`mobile-${item.id}`}
                    className={`sl-mobile-card ${isCritical ? 'sl-mobile-card--critical' : ''}`}
                  >
                    <div className="sl-mobile-card__top">
                      <div className="sl-mobile-card__thumb-box">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="sl-mobile-card__thumb"
                            loading="lazy"
                          />
                        ) : (
                          <div className="sl-mobile-card__thumb-placeholder">
                            <Package size={20} className="sl-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="sl-mobile-card__header-info">
                        <div className="sl-mobile-card__badges">
                          <span
                            className={`sl-badge sl-badge--status sl-badge--status-${item.status}`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                          <span className={`sl-badge sl-badge--${badgeVariant}`}>
                            {item.urgencyLabel}
                          </span>
                        </div>
                        <h4 className="sl-mobile-card__title">{item.title}</h4>
                        <p className="sl-mobile-card__donor">
                          <Building2 size={12} /> {item.donorOrg}
                        </p>
                      </div>
                    </div>

                    <div className="sl-mobile-card__details">
                      <div className="sl-mobile-card__detail-item">
                        <span className="sl-text-muted">Quantity:</span>
                        <strong>
                          {item.quantity} {item.unit}
                        </strong>
                      </div>
                      <div className="sl-mobile-card__detail-item">
                        <span className="sl-text-muted">Storage:</span>
                        <span className="sl-capitalize">{item.storageCondition}</span>
                      </div>
                      <div className="sl-mobile-card__detail-item">
                        <span className="sl-text-muted">Date:</span>
                        <span>{formatDisplayDate(item.relevantDate)}</span>
                      </div>
                      <div className="sl-mobile-card__detail-item">
                        <span className="sl-text-muted">Verification:</span>
                        <span className="sl-text-success sl-font-semibold">✓ Verified</span>
                      </div>
                    </div>

                    <div className="sl-mobile-card__actions">
                      <button
                        type="button"
                        className="sl-btn sl-btn--subtle sl-btn--sm sl-w-full"
                        onClick={() => {
                          setSelectedListing(item);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>
                      {item.status === 'available' && (
                        <button
                          type="button"
                          className="sl-btn sl-btn--primary sl-btn--sm sl-w-full"
                          onClick={() => handleOpenClaimClick(item)}
                        >
                          <HeartHandshake size={14} />
                          <span>Reserve</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal: Create Food Listing */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onListingCreated={handleListingCreated}
      />

      {/* Modal: View Details & Inspection */}
      <ListingDetailsModal
        listing={selectedListing}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onOpenClaim={(listingToClaim) => {
          setSelectedListing(listingToClaim);
          setIsClaimOpen(true);
        }}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Modal: Claim / Reserve Donation */}
      <ClaimDonationModal
        listing={selectedListing}
        isOpen={isClaimOpen}
        onClose={() => setIsClaimOpen(false)}
        onClaimSuccess={handleClaimSuccess}
      />
    </div>
  );
};
