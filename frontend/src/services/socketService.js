import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000'; // Adjust if Flask runs elsewhere in dev
let socket;

const connect = (/* No token needed for initial connection based on current backend setup */) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }
  socket = io(SOCKET_URL, {
    // transports: ['websocket'], // Optional: force websocket only
    // auth: { token } // If backend socketio.on('connect') handled token auth
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('status', (data) => { // For join/leave room status
    console.log('Status:', data.message);
  });

  socket.on('error', (data) => { // For general errors from backend socket events
    console.error('Socket Error:', data.message);
  });


  return socket;
};

const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null; // Clean up
  }
};

const joinRoom = (ticketId) => {
  if (socket && socket.connected) {
    // Backend expects { ticket_id: ticketId }, not { room: 'ticket_' + ticketId } directly in data for join_room event
    // The room name itself is constructed on the backend using ticket_id.
    socket.emit('join_room', { ticket_id: ticketId });
  } else {
    console.error('Socket not connected. Cannot join room.');
  }
};

const leaveRoom = (ticketId) => {
  if (socket && socket.connected) {
    // Similar to joinRoom, backend expects { ticket_id: ticketId }
    socket.emit('leave_room', { ticket_id: ticketId });
  } else {
    console.error('Socket not connected. Cannot leave room.');
  }
};

const sendMessage = ({ ticket_id, content, token, image_url, audio_url }) => {
  if (socket && socket.connected) {
    const payload = { ticket_id, token }; // Token is required by backend's handle_send_message
    if (content) payload.content = content;
    if (image_url) payload.image_url = image_url;
    if (audio_url) payload.audio_url = audio_url;
    
    socket.emit('send_message', payload);
  } else {
    console.error('Socket not connected. Cannot send message.');
  }
};

const onNewMessage = (callback) => {
  if (socket) {
    socket.on('new_message', callback);
  }
};

const offNewMessage = (callback) => {
  if (socket) {
    socket.off('new_message', callback);
  }
};

export default {
  connect,
  disconnect,
  joinRoom,
  leaveRoom,
  sendMessage,
  onNewMessage,
  offNewMessage,
  // Expose socket instance if needed directly, though usually not recommended
  // getSocket: () => socket 
};
