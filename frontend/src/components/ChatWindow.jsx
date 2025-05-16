import React, { useRef, useEffect } from 'react';
import { Box, Fade } from '@mui/material';
import MessageItem from './MessageItem';

export default function ChatWindow({ messages }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {messages.map((message, index) => (
        <Fade key={message.id} in={true} timeout={300} style={{ transitionDelay: `${index * 100}ms` }}>
          <Box>
            <MessageItem
              role={message.role}
              content={message.content}
              isLoading={message.isLoading}
              error={message.error}
              visualization={message.visualization}
            />
          </Box>
        </Fade>
      ))}
      <div ref={messagesEndRef} />
    </Box>
  );
}