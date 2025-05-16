import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingIndicator = ({ message = "Processing your query..." }) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <CircularProgress 
        size={40} 
        thickness={4} 
        sx={{ 
          color: '#36c5f0',
          mb: 2 
        }} 
      />
      <Typography 
        variant="body2" 
        color="text.secondary" 
        textAlign="center"
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingIndicator;