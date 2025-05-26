import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ticketService from '../services/ticketService'; // Adjust path as needed
import { useAuth } from '../contexts/AuthContext'; // For token and error handling
import ChatInterface from '../components/chat/ChatInterface'; // Already imported
import TaskList from '../components/tasks/TaskList'; // Import TaskList

const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth(); // Ensure user is authenticated

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!token) {
        setError("You must be logged in to view ticket details.");
        setLoading(false);
        return;
      }
      if (!ticketId) {
        setError("Ticket ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await ticketService.getTicketById(ticketId);
        setTicket(data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch ticket details');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId, token]);

  if (loading) return <div>Loading ticket details...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!ticket) return <div>Ticket not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Ticket Details: {ticket.title}</h2>
      <p><strong>ID:</strong> {ticket.id}</p>
      <p><strong>Status:</strong> {ticket.status}</p>
      <p><strong>Priority:</strong> {ticket.priority}</p>
      <p><strong>Description:</strong></p>
      <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px', border: '1px solid #eee' }}>
        {ticket.description}
      </pre>
      <p><strong>Creator:</strong> {ticket.user_username || 'N/A'}</p>
      <p><strong>Assignee:</strong> {ticket.assignee_username || 'Not assigned'}</p>
      <p><strong>Created At:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
      <p><strong>Last Updated:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>
      
      <hr style={{ margin: '20px 0' }} />
      
      {/* Chat Interface */}
      <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Ticket Conversation</h3>
      <ChatInterface ticketId={ticketId} />

      <hr style={{ margin: '20px 0' }} />

      {/* Task List */}
      <TaskList ticketId={ticketId} />

      <Link to="/tickets" style={{ marginTop: '2rem', display: 'inline-block' }}>Back to Ticket List</Link>
    </div>
  );
};

export default TicketDetailPage;
