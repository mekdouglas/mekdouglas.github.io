import React from 'react';
import '../../styles/Notifications.css'; // We'll create this file later

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const handleMarkReadClick = (e) => {
    e.stopPropagation(); // Prevent click from bubbling if item itself is clickable
    onMarkAsRead(notification.id);
  };

  const itemStyle = notification.is_read 
    ? "notification-item read" 
    : "notification-item unread";

  // Create a clickable link if entity_type and link_to_entity_id are present
  const renderLink = (notification) => {
    if (notification.entity_type && notification.link_to_entity_id) {
      let path = '#'; // Default path
      if (notification.entity_type === 'ticket') {
        path = `/tickets/${notification.link_to_entity_id}`;
      } else if (notification.entity_type === 'task') {
        // Assuming tasks are viewed within a ticket context, this might need adjustment
        // For now, let's assume a direct link to a task page (not implemented) or just link to ticket
        path = `/tickets/${notification.link_to_entity_id}`; // Or a more specific task link
      }
      return <a href={path} className="notification-link">{notification.message}</a>;
    }
    return notification.message;
  };


  return (
    <li className={itemStyle}>
      <div className="notification-content">
        <span className="notification-type">[{notification.type.replace('_', ' ').toUpperCase()}]</span>
        <span className="notification-message">{renderLink(notification)}</span>
        <span className="notification-timestamp">
          {new Date(notification.created_at).toLocaleString()}
        </span>
      </div>
      {!notification.is_read && (
        <button 
          onClick={handleMarkReadClick} 
          className="mark-read-button"
          title="Mark as read"
        >
          ✓
        </button>
      )}
    </li>
  );
};

export default NotificationItem;
