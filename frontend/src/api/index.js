import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api';

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,  // 2 minutes
});

// Submit a query to the AI data agent
export const submitQuery = async (question) => {
  try {
    const response = await apiClient.post('/ask', { question: question });
    return response.data;
  } catch (error) {
    // Handle error gracefully
    const errorMessage = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : 'Failed to connect to the server';

    console.error('API Error:', error);

    // Return an error object that matches the response structure
    return {
      answer: 'Sorry, I encountered an error processing your request.',
      error: errorMessage,
    };
  }
};

export default {
  submitQuery,
};