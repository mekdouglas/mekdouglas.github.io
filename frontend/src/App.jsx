import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import DashboardPage from './pages/DashboardPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage'; // Import CreateTicketPage
import './App.css'; // Basic styling

function App() {
  return (
    <Routes>
      {/* Routes without MainLayout (e.g., login, register) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />

      {/* Protected Routes with MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} /> {/* New route for creating tickets */}
          <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
