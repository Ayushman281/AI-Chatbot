import React, { useState } from 'react';
import { Box, Paper, InputBase, IconButton, CircularProgress, Typography } from '@mui/material';

export default function ChatInput({ onSendMessage, isLoading }) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };

    // Create simple send arrow icon
    const SendIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
            />
        </svg>
    );

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Paper
                elevation={0}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid #ccc',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.5,
                    maxWidth: '800px',
                    mx: 'auto',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            >
                <InputBase
                    fullWidth
                    placeholder="Ask a question about your data..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                    sx={{
                        fontSize: '0.95rem',
                        py: 1,
                        color: '#333'
                    }}
                />
                <IconButton
                    type="submit"
                    color="primary"
                    disabled={!message.trim() || isLoading}
                    sx={{
                        backgroundColor: message.trim() && !isLoading ? '#512B58' : '#e0e0e0',
                        color: 'white',
                        width: 36,
                        height: 36,
                        '&:hover': {
                            backgroundColor: message.trim() && !isLoading ? '#663a6b' : '#e0e0e0',
                        }
                    }}
                >
                    {isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <SendIcon />
                    )}
                </IconButton>
            </Paper>

            {/* Press Enter text moved below the input box */}
            <Typography
                variant="caption"
                align="center"
                sx={{
                    display: 'block',
                    mt: 1,
                    color: '#888',
                    fontSize: '0.75rem',
                    textAlign: 'center'
                }}
            >
                Press Enter to send, Shift+Enter for new line
            </Typography>
        </Box>
    );
}