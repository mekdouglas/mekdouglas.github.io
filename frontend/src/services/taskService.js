import axios from 'axios';

const API_BASE_URL = '/api'; // Common base for API endpoints

// Fetches tasks for a specific ticket
const getTasksForTicket = async (ticketId) => {
  const response = await axios.get(`${API_BASE_URL}/tickets/${ticketId}/tasks`);
  return response.data; // Expects an array of tasks
};

// Creates a new task for a specific ticket
const createTask = async (ticketId, taskData) => {
  // taskData should include { title, description (optional), status (optional), due_date (optional), assigned_to_id (optional) }
  const response = await axios.post(`${API_BASE_URL}/tickets/${ticketId}/tasks`, taskData);
  return response.data; // Expects { message, task }
};

// Updates an existing task
const updateTask = async (taskId, taskData) => {
  // taskData can include any fields to be updated (title, description, status, due_date, assigned_to_id)
  const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData);
  return response.data; // Expects { message, task }
};

// Deletes a task
const deleteTask = async (taskId) => {
  const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
  return response.data; // Expects { message }
};

export default {
  getTasksForTicket,
  createTask,
  updateTask,
  deleteTask,
};
