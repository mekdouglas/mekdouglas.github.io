import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ticketService from '../../services/ticketService';
import socketService from '../../services/socketService';
import './ChatInterface.css'; // We'll create this file next

const ChatInterface = ({ ticketId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'audio'
  const [filePreview, setFilePreview] = useState(null); // For image previews
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const messagesEndRef = useRef(null); // To scroll to the bottom

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!ticketId || !token) {
      setError("Ticket ID or authentication token is missing.");
      return;
    }

    // Connect and join room
    const currentSocket = socketService.connect(); // Assuming connect doesn't need token for initial connection
    socketService.joinRoom(ticketId);

    // Fetch initial messages
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setError(null);
      try {
        const data = await ticketService.getMessagesForTicket(ticketId);
        // Messages from API are paginated and ordered desc (latest first),
        // but for chat display, we usually want chronological (oldest first).
        setMessages(data.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch messages.');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Listener for new messages
    const handleNewMessage = (incomingMessage) => {
      // Check if the message is for the current ticketId
      // Backend sends to room 'ticket_<ticketId>', so this check might be redundant
      // if client only listens to one room at a time or if socketService handles room-specific listeners.
      // For now, assuming all 'new_message' events are for the current room.
      if (incomingMessage.ticket_id === parseInt(ticketId)) {
         setMessages((prevMessages) => {
          // Avoid duplicates if message already received via initial fetch
          if (prevMessages.find(msg => msg.id === incomingMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, incomingMessage];
        });
      }
    };

    socketService.onNewMessage(handleNewMessage);

    // Cleanup on component unmount or ticketId change
    return () => {
      socketService.leaveRoom(ticketId);
      socketService.offNewMessage(handleNewMessage);
      // Consider if socketService.disconnect() should be called here.
      // If navigating away from any chat, maybe. If just switching tickets, maybe not.
      // For simplicity, we won't disconnect here, assuming user might navigate to another ticket.
    };
  }, [ticketId, token]); // Re-run effect if ticketId or token changes

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setError(null);

    if (!token) {
      setError("Authentication token is missing. Cannot send message.");
      return;
    }

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      let uploadServiceFn;
      let fileKey;
      let messagePayloadKey;

      if (fileType === 'image') {
        formData.append('image', selectedFile);
        uploadServiceFn = fileUploadService.uploadImage;
        fileKey = 'image_url';
      } else if (fileType === 'audio') {
        formData.append('audio', selectedFile);
        uploadServiceFn = fileUploadService.uploadAudio;
        fileKey = 'audio_url';
      } else {
        setUploadError("Invalid file type selected.");
        setIsUploading(false);
        return;
      }

      try {
        const response = await uploadServiceFn(formData);
        const fileUrl = response[fileKey];

        socketService.sendMessage({
          ticket_id: parseInt(ticketId),
          token: token,
          [fileKey]: fileUrl, // e.g., image_url: 'path/to/image.jpg'
          content: `[Sent a ${fileType}]` // Optional: placeholder content
        });

        setSelectedFile(null);
        setFileType(null);
        setFilePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = null;
        if (audioInputRef.current) audioInputRef.current.value = null;

      } catch (err) {
        setUploadError(err.response?.data?.message || err.message || `Failed to upload ${fileType}.`);
      } finally {
        setIsUploading(false);
      }
    } else if (newMessage.trim()) {
      socketService.sendMessage({
        ticket_id: parseInt(ticketId),
        content: newMessage,
        token: token,
      });
      setNewMessage('');
    } else {
      // Neither file nor text, do nothing or show a message
      return;
    }
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileType('image');
      setFilePreview(URL.createObjectURL(file));
      setNewMessage(''); // Clear text input if file is selected
      if (audioInputRef.current) audioInputRef.current.value = null; // Clear other file input
    }
  };

  const handleAudioFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileType('audio');
      setFilePreview(null); // No preview for audio, or could show file name
      setNewMessage(''); // Clear text input
      if (imageInputRef.current) imageInputRef.current.value = null; // Clear other file input
    }
  };
  
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileType(null);
    setFilePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = null;
    if (audioInputRef.current) audioInputRef.current.value = null;
  };


  // Function to determine if a message is from the current logged-in user
  // This requires knowing the current user's username or ID.
  // We'll assume the message object contains `user_username` and `user_id`.
  // And `AuthContext.user` might have `username` or `id`.
  // For this example, let's say `AuthContext.user` has `id`. (This wasn't explicitly set up in AuthContext, but it's a common pattern)
  // The backend currently sends `user_username`. If we want to compare by ID, backend's `message.to_dict()` should include `user_id`.
  // Let's assume for now `user.username` is available from AuthContext and matches `message.user_username`.
  // This is a placeholder - robust user identification would be needed.
  const isCurrentUserMessage = (messageSenderUsername) => {
    // This depends on AuthContext providing user.username or similar.
    // If user.username is not available, this will need adjustment.
    // Backend's message.to_dict() currently sends `user_username`.
    return user && user.username && user.username === messageSenderUsername; 
  };

  if (error) return <div style={{ color: 'red', padding: '1rem' }}>Error: {error}</div>;
  if (loadingMessages) return <div style={{ padding: '1rem' }}>Loading messages...</div>;

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.length === 0 && <p>No messages yet. Start the conversation!</p>}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-item ${isCurrentUserMessage(msg.user_username) ? 'current-user' : 'other-user'}`}
          >
            <div className="message-sender">{msg.user_username || 'System'}</div>
            {msg.content && <div className="message-content">{msg.content}</div>}
            {msg.image_url && (
              <div className="message-media">
                {/* Assuming image_url is like /static/uploads/images/file.jpg */}
                <img src={msg.image_url} alt="Uploaded content" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px' }} />
              </div>
            )}
            {msg.audio_url && (
              <div className="message-media">
                {/* Assuming audio_url is like /static/uploads/audio/file.mp3 */}
                <audio controls src={msg.audio_url}>Your browser does not support the audio element.</audio>
              </div>
            )}
            <div className="message-timestamp">{new Date(msg.created_at).toLocaleTimeString()}</div>
            {msg.mentions && msg.mentions.length > 0 && (
              <div className="message-mentions">
                Mentions: {msg.mentions.map(m => `@${m.username}`).join(' ')}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {uploadError && <p style={{ color: 'red', padding: '0 15px' }}>{uploadError}</p>}
      {isUploading && <p style={{ padding: '0 15px' }}>Uploading file...</p>}

      {filePreview && (
        <div className="file-preview">
          <img src={filePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', margin: '0 15px 10px' }} />
          <button onClick={clearSelectedFile} className="clear-file-button">Clear File</button>
        </div>
      )}
       {selectedFile && fileType === 'audio' && (
        <div className="file-preview">
          <p style={{ margin: '0 15px 10px' }}>Selected audio: {selectedFile.name}</p>
          <button onClick={clearSelectedFile} className="clear-file-button">Clear File</button>
        </div>
      )}


      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
          disabled={isUploading || !!selectedFile} // Disable text input if file selected or uploading
        />
         <label htmlFor="image-upload" className="file-upload-label">📷</label>
        <input 
          id="image-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageFileChange} 
          style={{ display: 'none' }} 
          ref={imageInputRef}
          disabled={isUploading}
        />
        <label htmlFor="audio-upload" className="file-upload-label">🎤</label>
        <input 
          id="audio-upload" 
          type="file" 
          accept="audio/*" 
          onChange={handleAudioFileChange} 
          style={{ display: 'none' }} 
          ref={audioInputRef}
          disabled={isUploading}
        />
        <button type="submit" className="send-button" disabled={isUploading || (!newMessage.trim() && !selectedFile)}>
          {isUploading ? 'Sending...' : (selectedFile ? `Send ${fileType}` : 'Send')}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
