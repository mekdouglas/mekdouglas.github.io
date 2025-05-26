import axios from 'axios';

const API_URL = '/api/upload'; // Base URL for upload endpoints

const uploadImage = async (formData) => {
  // Axios will use default headers, including Authorization if set by AuthContext
  const response = await axios.post(`${API_URL}/image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Expects { image_url: '...' }
};

const uploadAudio = async (formData) => {
  // Axios will use default headers
  const response = await axios.post(`${API_URL}/audio`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Expects { audio_url: '...' }
};

export default {
  uploadImage,
  uploadAudio,
};
