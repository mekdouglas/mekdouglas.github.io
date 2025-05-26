import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // For token, if needed for auth checks directly here
import '../../styles/Tasks.css'; // Import task styles

const TaskItem = ({ task, onUpdateTask, onDeleteTask }) => {
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [isEditing, setIsEditing] = useState(false); // For future inline editing
  const { user } = useAuth(); // To check if current user can delete/edit (not fully implemented here)

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus);
    onUpdateTask(task.id, { status: newStatus });
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete task: "${task.title}"?`)) {
      onDeleteTask(task.id);
    }
  };

  // Placeholder for more advanced edit permissions
  // const canEdit = user && (user.id === task.created_by_id || user.is_admin);
  // const canDelete = user && (user.id === task.created_by_id || user.is_admin);

  return (
    <div className="task-item" style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', backgroundColor: '#fff' }}>
      <h5 style={{ marginTop: 0, marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
        {task.title} (ID: {task.id})
        {/* Add edit button later if inline editing is implemented */}
      </h5>
      
      {task.description && <p style={{ fontSize: '0.9em', color: '#555' }}>{task.description}</p>}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.85em', marginBottom: '10px' }}>
        <div><strong>Created By:</strong> {task.created_by_username || 'N/A'}</div>
        <div><strong>Assigned To:</strong> {task.assigned_to_username || 'Not assigned'}</div>
        <div><strong>Due Date:</strong> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</div>
        <div><strong>Created At:</strong> {new Date(task.created_at).toLocaleString()}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
        <div>
          <label htmlFor={`task-status-${task.id}`} style={{ marginRight: '5px', fontWeight: 'bold' }}>Status:</label>
          <select 
            id={`task-status-${task.id}`} 
            value={currentStatus} 
            onChange={handleStatusChange}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button 
          onClick={handleDelete} 
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Delete Task
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
