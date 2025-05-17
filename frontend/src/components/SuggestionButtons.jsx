import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function SuggestionButtons({ onSelectSuggestion }) {
  const suggestions = [
    // Simple Questions
    {
      title: "What album was released in 2016?",
      description: "Simple query for album by year",
    },
    {
      title: "List the most expensive tracks",
      description: "Show tracks ordered by price",
    },

    // Medium Questions
    {
      title: "List tracks with prices higher than $1.00 and their albums",
      description: "Join tracks with their albums",
    },
    {
      title: "Compare track lengths across different genres",
      description: "Aggregation by genre with averages",
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