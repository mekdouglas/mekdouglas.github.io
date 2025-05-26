import axios from 'axios';

const API_URL = '/api/auth'; // Assuming backend is served on the same domain

const login = async (credentials) => {
  const response = await axios.post(`${API_URL}/login`, credentials);
  return response.data; // Should include { message, access_token }
};

const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data; // Should include { message }
};

// Optional: Add a 'me' service if backend provides user details from token
// const getMe = async () => {
//   const response = await axios.get(`${API_URL}/me`); // Assuming token is set in axios defaults
//   return response.data; // Should include user object
// };

export default {
  login,
  register,
  // getMe,
};
