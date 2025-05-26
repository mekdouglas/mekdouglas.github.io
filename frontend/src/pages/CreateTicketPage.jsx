import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ticketService from '../services/ticketService'; // Adjust path as needed
import { useAuth } from '../contexts/AuthContext'; // For token and error handling

const CreateTicketPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium'); // Default priority
  // Add assignee_id later if there's a user selection mechanism
  // const [assigneeId, setAssigneeId] = useState('');

  const { token, error: authError, setError: setAuthError } = useAuth(); // Renamed error to authError to avoid clash
  const [formError, setFormError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setFormError("You must be logged in to create a ticket.");
      return;
    }
    setFormError(null);
    setAuthError(null); // Clear auth context errors
    setIsLoading(true);

    try {
      const ticketData = { title, description, priority };
      // if (assigneeId) ticketData.assignee_id = assigneeId;
      
      const response = await ticketService.createTicket(ticketData);
      if (response.ticket && response.ticket.id) {
        navigate(`/tickets/${response.ticket.id}`); // Navigate to the new ticket's detail page
      } else {
        navigate('/tickets'); // Fallback to ticket list
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  if (authError) { // If there's an error from AuthContext (e.g. token expired during navigation)
      return <div style={{ color: 'red' }}>Authentication Error: {authError}. Please re-login.</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Create New Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="5"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="priority">Priority:</label>
          <select 
            id="priority" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        {/* 
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="assigneeId">Assignee ID (Optional):</label>
          <input
            type="text" // Ideally a user selector component
            id="assigneeId"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div> 
        */}
        {formError && <p style={{ color: 'red', marginBottom: '10px' }}>{formError}</p>}
        <button 
          type="submit" 
          disabled={isLoading} 
          style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {isLoading ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
};

export default CreateTicketPage;
