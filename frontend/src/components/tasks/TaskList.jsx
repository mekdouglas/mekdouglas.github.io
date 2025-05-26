import React, { useState, useEffect, useCallback } from 'react';
import taskService from '../../services/taskService';
import { useAuth } from '../../contexts/AuthContext';
import TaskItem from './TaskItem';
import CreateTaskForm from './CreateTaskForm';
import '../../styles/Tasks.css'; // Import task styles

const TaskList = ({ ticketId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!token || !ticketId) {
      // setError("Cannot fetch tasks: missing token or ticket ID.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasksForTicket(ticketId);
      setTasks(data.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))); // Show newest first
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to fetch tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateTask = async (taskId, updatedData) => {
    if (!token) return;
    try {
      await taskService.updateTask(taskId, updatedData);
      fetchTasks(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update task.");
      // Optionally, revert optimistic UI updates here if any were made
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!token) return;
    try {
      await taskService.deleteTask(taskId);
      fetchTasks(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete task.");
    }
  };

  return (
    <div className="task-list-container" style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '15px' }}>Tasks for this Ticket</h3>
      
      <CreateTaskForm ticketId={ticketId} onTaskCreated={fetchTasks} />

      {isLoading && <p>Loading tasks...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!isLoading && tasks.length === 0 && !error && <p>No tasks found for this ticket.</p>}
      
      <div className="tasks">
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask} 
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
