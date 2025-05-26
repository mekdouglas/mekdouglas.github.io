import React from 'react';
import NotificationItem from './NotificationItem';
import '../../styles/Notifications.css'; // We'll create this file later

const NotificationList = ({ notifications, onMarkOneAsRead, onMarkAllAsRead }) => {
  if (!notifications || notifications.length === 0) {
    return <div className="notification-list-empty"><p>No notifications.</p></div>;
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-list">
      {unreadCount > 0 && (
        <div className="notification-list-header">
          <button onClick={onMarkAllAsRead} className="mark-all-read-button">
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}
      <ul>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkOneAsRead}
          />
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;
