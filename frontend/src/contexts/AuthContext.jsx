import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService'; // Assume authService.js is in ../services

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Could store decoded token info or user object from backend
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState(false); // For UI feedback
  const [error, setError] = useState(null);

  useEffect(() => {
    // On initial load, if token exists, set it in axios defaults
    // and update isAuthenticated state.
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      setToken(storedToken);
      setIsAuthenticated(true);
      // Optionally, you could try to fetch user details here if the token is valid
      // For now, we'll assume the presence of a token means authenticated.
      // setUser({ token: storedToken }); // Placeholder user object
    }
    setIsLoading(false); // Initial loading done
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);
      if (data.access_token) {
        localStorage.setItem('authToken', data.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        setToken(data.access_token);
        // setUser({ token: data.access_token }); // Placeholder user object
        setIsAuthenticated(true);
        setError(null);
        return true; // Indicate success
      } else {
        // Should not happen if backend is consistent
        setError(data.message || 'Login failed: No token received.');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
      setIsAuthenticated(false);
      return false; // Indicate failure
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(userData);
      // Assuming successful registration doesn't auto-login
      setError(null); // Clear any previous errors
      return { success: true, message: data.message || 'Registration successful!' };
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
      return { success: false, message: err.response?.data?.message || err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    // No navigation here, components calling logout should handle it.
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setError // Expose setError to allow components to clear errors if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
