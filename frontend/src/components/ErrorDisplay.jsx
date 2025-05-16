import React from 'react';
import { Alert, Box } from '@mui/material';

export default function ErrorDisplay({ message }) {
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="error" variant="filled">
        {message}
      </Alert>
    </Box>
  );
}