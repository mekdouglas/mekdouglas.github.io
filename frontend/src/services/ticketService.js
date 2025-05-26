import axios from 'axios';

const API_URL = '/api/tickets'; // Base URL for ticket endpoints

// Axios instance can be configured here if needed, or rely on global defaults
// (e.g., Authorization header set by AuthContext)

const getAllTickets = async () => {
  const response = await axios.get(API_URL);
  return response.data; // Expects an array of tickets
};

const createTicket = async (ticketData) => {
  // The backend /api/tickets (POST) is already defined to create tickets
  // It expects { title, description, priority (optional), assignee_id (optional) }
  // The current_user.id is added on the backend via @token_required
  const response = await axios.post(API_URL, ticketData);
  return response.data; // Expects { message, ticket }
};

const getTicketById = async (ticketId) => {
  const response = await axios.get(`${API_URL}/${ticketId}`);
  return response.data; // Expects a single ticket object
};

// Optional: Add update and delete services later if needed
// const updateTicket = async (ticketId, updateData) => {
//   const response = await axios.put(`${API_URL}/${ticketId}`, updateData);
//   return response.data;
// };

export default {
  getAllTickets,
  createTicket,
  getTicketById,
  // updateTicket,
  getMessagesForTicket,
};

async function getMessagesForTicket(ticketId) {
  // The backend endpoint is GET /api/tickets/<int:ticket_id>/messages
  // This was defined in routes/chat.py
  const response = await axios.get(`/api/tickets/${ticketId}/messages`);
  return response.data; // Expects { messages, total_messages, current_page, total_pages }
}
