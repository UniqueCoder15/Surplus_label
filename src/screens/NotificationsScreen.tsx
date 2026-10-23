import React, { useState } from 'react';
import {
  Bell,
  HandHeart,
  CheckCircle2,
  Calendar,
  PackageCheck,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationItem {
  id: string;
  type: 'request' | 'approved' | 'scheduled' | 'completed' | 'alert';
  title: string;
  desc: string;
  timestamp: string;
  unread: boolean;
  listingId?: string;
}

interface NotificationsScreenProps {
  onNavigate: (screen: string, listingId?: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'updates' | 'alerts'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      type: 'request',
      title: 'New pickup request',
      desc: 'Food bank requested Yippee Noodles',
      timestamp: '2 mins ago',
      unread: true,
      listingId: 'lst_demo_006',
    },
    {
      id: 'notif_2',
      type: 'approved',
      title: 'Listing approved',
      desc: 'Your Britannia Biscuits listing is now live',
      timestamp: '1 hour ago',
      unread: true,
      listingId: 'lst_demo_007',
    },
    {
      id: 'notif_3',
      type: 'scheduled',
      title: 'Pickup scheduled',
      desc: 'Amul Milk pickup scheduled for 22 Oct',
      timestamp: '3 hours ago',
      unread: false,
      listingId: 'lst_demo_008',
    },
    {
      id: 'notif_4',
      type: 'completed',
      title: 'Listing completed',
      desc: "Lay's Chips marked as collected",
      timestamp: '1 day ago',
      unread: false,
      listingId: 'lst_demo_009',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'requests') return item.type === 'request' || item.type === 'scheduled';
    if (activeTab === 'updates') return item.type === 'approved' || item.type === 'completed';
    return item.type === 'alert';
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'request':
        return (
          <div className="sl-notif-icon-box-ref sl-notif-icon-box-ref--request">
            <HandHeart size={18} />
          </div>
        );
      case 'approved':
        return (
          <div className="sl-notif-icon-box-ref sl-notif-icon-box-ref--approved">
            <CheckCircle2 size={18} />
          </div>
        );
      case 'scheduled':
        return (
          <div className="sl-notif-icon-box-ref sl-notif-icon-box-ref--scheduled">
            <Calendar size={18} />
          </div>
        );
      case 'completed':
        return (
          <div className="sl-notif-icon-box-ref sl-notif-icon-box-ref--completed">
            <PackageCheck size={18} />
          </div>
        );
      default:
        return (
          <div className="sl-notif-icon-box-ref sl-notif-icon-box-ref--alert">
            <AlertTriangle size={18} />
          </div>
        );
    }
  };

  return (
    <div className="sl-notifications-page-ref">
      <div className="sl-container sl-notifications-container-ref">
        {/* Header */}
        <div className="sl-notif-header-ref">
          <h1 className="sl-notif-title-ref">Notifications</h1>
          <button
            type="button"
            className="sl-notif-mark-read-btn-ref"
            onClick={markAllRead}
          >
            <CheckCheck size={16} />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Filter Tabs matching Reference */}
        <div className="sl-notif-tabs-bar-ref">
          <button
            type="button"
            className={`sl-notif-tab-ref ${activeTab === 'all' ? 'sl-notif-tab-ref--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`sl-notif-tab-ref ${activeTab === 'requests' ? 'sl-notif-tab-ref--active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Requests
          </button>
          <button
            type="button"
            className={`sl-notif-tab-ref ${activeTab === 'updates' ? 'sl-notif-tab-ref--active' : ''}`}
            onClick={() => setActiveTab('updates')}
          >
            Updates
          </button>
          <button
            type="button"
            className={`sl-notif-tab-ref ${activeTab === 'alerts' ? 'sl-notif-tab-ref--active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
        </div>

        {/* Notifications List Card */}
        <div className="sl-notif-list-card-ref">
          {filtered.length === 0 ? (
            <div className="sl-notif-empty-ref">
              <Bell size={40} className="sl-notif-empty-icon-ref" />
              <h3>No notifications in this category</h3>
              <p>You're all caught up with your food rescue activities!</p>
            </div>
          ) : (
            <div className="sl-notif-items-wrap-ref">
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  className={`sl-notif-item-ref ${item.unread ? 'sl-notif-item-ref--unread' : ''}`}
                  whileHover={{ backgroundColor: '#f8faf7' }}
                  onClick={() => {
                    if (item.listingId) onNavigate('details', item.listingId);
                  }}
                >
                  <div className="sl-notif-item-left-ref">
                    {getIcon(item.type)}
                    <div className="sl-notif-item-content-ref">
                      <div className="sl-notif-item-top-row-ref">
                        <strong className="sl-notif-item-title-ref">{item.title}</strong>
                        {item.unread && <span className="sl-notif-unread-dot-ref" />}
                      </div>
                      <p className="sl-notif-item-desc-ref">{item.desc}</p>
                    </div>
                  </div>

                  <div className="sl-notif-item-right-ref">
                    <span className="sl-notif-timestamp-ref">{item.timestamp}</span>
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
