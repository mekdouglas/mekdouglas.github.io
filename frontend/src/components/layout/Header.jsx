import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../notifications/NotificationBell'; // Import NotificationBell

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth(); // Removed unused 'token' variable
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // A simple way to get a display name, e.g., from token if it's a JWT and we decode it (not done here)
  // Or if user object from context contains more details.
  // For now, just showing generic welcome or login/register links.
  // const username = user?.username || 'User'; // Placeholder for actual username

  // Styles are now primarily in index.css, but some dynamic/structural ones can remain or be classes
  return (
    <header> {/* className="app-header" could be used if more specific styling needed beyond global 'header' tag */}
      <Link to="/" className="header-logo-link">
        Helpdesk System
      </Link>
      <nav className="header-nav">
        {isAuthenticated ? (
          <>
            <NotificationBell />
            <button 
              onClick={handleLogout} 
              className="header-nav-button logout-button" // Added classes for more specific styling
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="header-nav-link">Login</Link>
            <Link to="/register" className="header-nav-link">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
