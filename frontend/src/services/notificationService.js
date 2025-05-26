import axios from 'axios';

const API_BASE_URL = '/api/notifications'; // Base URL for notification endpoints

// Fetches notifications for the current user
const getNotifications = async () => {
  // Backend by default returns unread notifications unless ?all=true is passed.
  // For the bell, we might want to fetch all initially to show a comprehensive list,
  // or fetch only unread and then provide an option to see all.
  // Let's assume for now it fetches all as per backend behavior and frontend can filter.
  // Or, let's decide to fetch only unread for the bell's dropdown by default.
  // The backend GET /api/notifications defaults to unread=false, so it gets unread.
  // To get all, use /api/notifications?all=true
  const response = await axios.get(`${API_BASE_URL}?all=true`); // Fetch all to manage state locally
  return response.data; // Expects an array of notification objects
};

// Marks a specific notification as read
const markAsRead = async (notificationId) => {
  const response = await axios.post(`${API_BASE_URL}/${notificationId}/mark-read`);
  return response.data; // Expects { message, notification }
};

// Marks all unread notifications as read for the current user
const markAllAsRead = async () => {
  const response = await axios.post(`${API_BASE_URL}/mark-all-read`);
  return response.data; // Expects { message, count }
};

export default {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
