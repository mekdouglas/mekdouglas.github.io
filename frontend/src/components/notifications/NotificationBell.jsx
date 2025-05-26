import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import NotificationList from './NotificationList';
import '../../styles/Notifications.css'; // We'll create this file later

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const bellRef = useRef(null); // For detecting clicks outside

  const calculateUnreadCount = (notifs) => {
    return notifs.filter(n => !n.is_read).length;
  };

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      // Sort notifications by created_at descending (newest first) for display
      data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(data);
      setUnreadCount(calculateUnreadCount(data));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // Add polling or WebSocket listener here for real-time updates if desired
    // For now, we refetch when the bell is opened
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [bellRef]);


  const handleToggleOpen = () => {
    const newIsOpenState = !isOpen;
    setIsOpen(newIsOpenState);
    if (newIsOpenState) { // If opening, refresh notifications
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    if (!token) return;
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1)); // Ensure count doesn't go below zero
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to mark all notifications as read.");
    }
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button onClick={handleToggleOpen} className="notification-bell-button">
        🔔 {/* Bell icon or text */}
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="notification-dropdown">
          {isLoading && <p className="loading-message">Loading notifications...</p>}
          {error && <p className="error-message">{error}</p>}
          {!isLoading && !error && (
            <NotificationList 
              notifications={notifications}
              onMarkOneAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
