import React, { useState } from 'react';
import { Box, Container, ThemeProvider, CssBaseline } from '@mui/material';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import SuggestionButtons from './components/SuggestionButtons';
import theme from './theme';
import useChat from './hooks/useChat';

function App() {
  const { messages, chartData, isLoading, error, sendMessage, clearChat } = useChat();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Handle new chat - clear everything
  const handleNewChat = () => {
    clearChat();
  };

  // Handle logo click - just refresh the page component without clearing data
  const handleLogoClick = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Check if we should show the welcome screen (no messages)
  const showWelcome = messages.length === 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#f8f9fa'
      }}>
        <Header
          onNewChat={handleNewChat}
          onLogoClick={handleLogoClick}
        />

        <Container maxWidth="md" sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          px: { xs: 2, sm: 3 }
        }}>
          <Box sx={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: showWelcome ? 'center' : 'flex-start',
            mb: 2
          }}>
            {showWelcome ? (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ mb: 4 }}>
                  <Box component="h1" sx={{
                    color: '#512B58',
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    mb: 2
                  }}>
                    Welcome to AI Data Agent
                  </Box>
                  <Box component="p" sx={{
                    color: '#666',
                    fontSize: '1rem',
                    mb: 3
                  }}>
                    Ask questions about your data in natural language. I can analyze, visualize, and provide insights from your database.
                  </Box>
                  <Box component="p" sx={{
                    color: '#888',
                    fontSize: '0.95rem',
                    fontStyle: 'italic'
                  }}>
                    Try asking about sales trends, customer data, or product performance.
                  </Box>
                </Box>

                <Box sx={{ mt: 6 }}>
                  <Box component="p" sx={{ mb: 1, color: '#666' }}>
                    Try asking:
                  </Box>
                  <SuggestionButtons onSelectSuggestion={sendMessage} />
                </Box>
              </Box>
            ) : (
              <ChatWindow key={`chat-${forceUpdate}`} messages={messages} />
            )}
          </Box>

          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isLoading}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;