import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function SuggestionButtons({ onSelectSuggestion }) {
  const suggestions = [
    {
      title: 'Top 10 artists by revenue',
      description: 'Show highest earning musicians',
    },
    {
      title: 'Monthly streaming trends',
      description: 'Analyze music streaming patterns',
    },
    {
      title: 'Genre performance analysis',
      description: 'Compare popularity across genres',
    },
    {
      title: 'Album sales distribution',
      description: 'View sales across different formats',
    }
  ];

  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2,
      justifyContent: 'center'
    }}>
      {suggestions.map((suggestion, index) => (
        <Paper
          key={index}
          onClick={() => onSelectSuggestion(suggestion.title)}
          sx={{
            p: 2,
            width: '220px',
            cursor: 'pointer',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              borderColor: '#ccc'
            }
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: '#2196f3',
              fontWeight: 500,
              fontSize: '0.95rem',
              mb: 0.5
            }}
          >
            {suggestion.title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#777',
              fontSize: '0.875rem'
            }}
          >
            {suggestion.description}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}