import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ticketService from '../services/ticketService'; // Adjust path as needed
import { useAuth } from '../contexts/AuthContext'; // For error handling or loading state if desired

const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // Ensure user is authenticated, or ticketService will fail

  useEffect(() => {
    const fetchTickets = async () => {
      if (!token) {
        setError("You must be logged in to view tickets.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await ticketService.getAllTickets();
        setTickets(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [token]); // Re-fetch if token changes (e.g., after login)

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Ticket List</h2>
      <Link to="/tickets/new" style={{ marginBottom: '1rem', display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Create New Ticket
      </Link>
      {tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tickets.map(ticket => (
            <li key={ticket.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px' }}>
              <Link to={`/tickets/${ticket.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{ticket.title} (ID: {ticket.id})</h3>
                <p><strong>Status:</strong> {ticket.status}</p>
                <p><strong>Creator:</strong> {ticket.user_username || 'N/A'}</p>
                <p><strong>Created At:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TicketListPage;
