import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { submitQuery } from '../api';
import useLocalStorage from './useLocalStorage';

export default function useChat() {
  // Load conversation from localStorage or initialize empty
  const [messages, setMessages] = useLocalStorage('ai-data-agent-messages', []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);

  // Add this effect to keep chartData in sync with the latest message that has visualization
  useEffect(() => {
    // Find the last message with visualization data
    const lastMessageWithVisualization = [...messages]
      .reverse()
      .find(msg => msg.visualization);

    if (lastMessageWithVisualization) {
      setChartData(lastMessageWithVisualization.visualization);
    }
  }, [messages]);

  // Send a message to the AI and handle the response
  const sendMessage = async (question) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessageId = uuidv4();
      const userMessage = {
        id: userMessageId,
        role: 'user',
        content: question
      };

      // Add temporary loading message for the agent
      const agentMessageId = uuidv4();
      const agentMessageLoading = {
        id: agentMessageId,
        role: 'assistant',
        content: '',
        isLoading: true
      };

      setMessages(prev => [...prev, userMessage, agentMessageLoading]);

      // Submit query to backend
      const response = await submitQuery(question);

      // Update messages with the response AND visualization data
      setMessages(prev => prev.map(msg =>
        msg.id === agentMessageId
          ? {
            ...msg,
            content: response.answer,
            isLoading: false,
            // Associate visualization data with the message:
            visualization: response.result ? {
              result: response.result,
              chartType: response.chartType || 'table',
              sql: response.sql,
              question: question
            } : null
          }
          : msg
      ));

      // Clear the separate chartData state since we're now storing viz with messages
      setChartData(null);

      setIsLoading(false);
    } catch (err) {
      setError(`Error: ${err.message || 'Failed to get response'}`);
      setIsLoading(false);

      // Update loading message to show error
      setMessages(prev => prev.map(msg =>
        msg.isLoading
          ? { ...msg, content: 'Sorry, I encountered an error processing your request.', isLoading: false, error: true }
          : msg
      ));
    }
  };

  // Clear all messages and chart data
  const clearChat = useCallback(() => {
    setMessages([]);
    setChartData(null);
    setError(null);
  }, [setMessages]);

  return {
    messages,
    isLoading,
    error,
    chartData,
    sendMessage,
    clearChat,
  };
}