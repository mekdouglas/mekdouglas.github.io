import React, { useState } from 'react';
import taskService from '../../services/taskService';
import { useAuth } from '../../contexts/AuthContext'; // To ensure user is authenticated
import '../../styles/Tasks.css'; // Import task styles

const CreateTaskForm = ({ ticketId, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError("Authentication required.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setIsLoading(true);

    const taskData = {
      title,
      description,
      status,
      due_date: dueDate || null, // Send null if empty, backend handles it
      assigned_to_id: assignedToId ? parseInt(assignedToId, 10) : null,
    };

    try {
      await taskService.createTask(ticketId, taskData);
      // Reset form
      setTitle('');
      setDescription('');
      setStatus('pending');
      setDueDate('');
      setAssignedToId('');
      if (onTaskCreated) {
        onTaskCreated(); // Trigger refresh in parent
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-task-form" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
      <h4>Add New Task</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="task-title">Title: <span style={{color: 'red'}}>*</span></label>
        <input
          type="text"
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="task-description">Description:</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="3"
        />
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <label htmlFor="task-status">Status:</label>
          <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="task-due-date">Due Date:</label>
          <input
            type="date"
            id="task-due-date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="task-assignee">Assignee User ID (Optional):</label>
        <input
          type="number"
          id="task-assignee"
          value={assignedToId}
          onChange={(e) => setAssignedToId(e.target.value)}
          placeholder="Enter User ID"
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Adding Task...' : 'Add Task'}
      </button>
    </form>
  );
};

export default CreateTaskForm;
