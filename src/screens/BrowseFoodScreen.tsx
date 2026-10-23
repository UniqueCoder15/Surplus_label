import React, { useState, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types/inventory';

interface BrowseFoodScreenProps {
  onNavigate: (screen: string, listingId?: string) => void;
  onOpenClaimModal?: (listing: FoodListing) => void;
}

export const BrowseFoodScreen: React.FC<BrowseFoodScreenProps> = ({
  onNavigate,
}) => {
  const { authFetch } = useAuth();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        console.error('Failed to load listings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [authFetch]);

  // Filter listings by search query and category
  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.donorOrg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'urgent' && (item.urgencyBand === 'critical' || item.urgencyBand === 'urgent')) ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (item: FoodListing) => {
    if (item.urgencyBand === 'critical' || item.urgencyBand === 'urgent') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--urgent">Urgent</span>;
    }
    if (item.status === 'claimed') {
      return <span className="sl-status-pill-ref sl-status-pill-ref--pending">Requested</span>;
    }
    return <span className="sl-status-pill-ref sl-status-pill-ref--available">Available</span>;
  };

  return (
    <div className="sl-browse-page-ref">
      <div className="sl-container">
        {/* Search Bar matching Reference Header */}
        <div className="sl-browse-search-bar-wrap-ref">
          <div className="sl-browse-search-input-box-ref">
            <Search size={18} className="sl-browse-search-icon-ref" />
            <input
              type="text"
              className="sl-browse-search-input-ref"
              placeholder="Search food items (e.g. biscuits, milk)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Header Row */}
        <div className="sl-browse-header-row-ref">
          <div>
            <h1 className="sl-browse-title-ref">Available Food Listings</h1>
            <p className="sl-browse-sub-ref">
              Surplus food from shops, hostels and events.
            </p>
          </div>

          <button
            type="button"
            className={`sl-btn-ref sl-btn-ref--outline sl-btn-ref--filter ${showFilters ? 'sl-btn-ref--filter-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Pills Bar */}
        {showFilters && (
          <motion.div
            className="sl-browse-filter-bar-ref"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'all' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Items
            </button>
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'urgent' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('urgent')}
            >
              ⚡ Urgent Rescues
            </button>
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'canned_packaged' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('canned_packaged')}
            >
              Packaged Snacks
            </button>
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'bakery' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('bakery')}
            >
              Bakery & Biscuits
            </button>
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'dairy' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('dairy')}
            >
              Dairy & Milk
            </button>
            <button
              type="button"
              className={`sl-filter-chip-ref ${selectedCategory === 'pantry_grains' ? 'sl-filter-chip-ref--active' : ''}`}
              onClick={() => setSelectedCategory('pantry_grains')}
            >
              Grains & Cereals
            </button>
          </motion.div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="sl-loading-box-ref">
            <div className="sl-spinner-ref" />
            <p>Loading available food listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="sl-empty-state-ref">
            <Package size={48} className="sl-empty-state-icon-ref" />
            <h3>No surplus listings found</h3>
            <p>Try searching for a different item or clear your active filters.</p>
            <button
              type="button"
              className="sl-btn-ref sl-btn-ref--primary"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="sl-products-grid-3col-ref">
            {filteredListings.map((item) => (
              <motion.div
                key={item.id}
                className="sl-product-card-ref"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => onNavigate('details', item.id)}
              >
                <div className="sl-product-card-image-box-ref">
                  <img
                    src={item.imageUrl || '/noodles.jpg'}
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
                    {getStatusBadge(item)}
                    <button
                      type="button"
                      className="sl-card-action-btn-ref"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('details', item.id);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
