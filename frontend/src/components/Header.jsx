import React from 'react';
import { Box, Button, Typography, AppBar, Toolbar } from '@mui/material';
import DatabaseIcon from './DatabaseIcon'; // We'll create this simple SVG icon

export default function Header({ onNewChat, onLogoClick }) {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: '#512B58', // Exact purple color from reference
        color: 'white',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Logo */}
        <Box
          component="div"
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={onLogoClick}
        >
          <DatabaseIcon color="white" size={28} sx={{ mr: 1.5 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '0.01em'
            }}
          >
            AI Data Agent
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* New Chat button */}
        <Button
          variant="outlined"
          onClick={onNewChat}
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.5)',
            textTransform: 'none',
            px: 2,
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          New Chat
        </Button>
      </Toolbar>
    </AppBar>
  );
}