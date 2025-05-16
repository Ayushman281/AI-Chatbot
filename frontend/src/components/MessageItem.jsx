import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import VisualizationPanel from './VisualizationPanel';

export default function MessageItem({ role, content, isLoading, visualization }) {
  const isAgent = role === 'assistant';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAgent ? 'flex-start' : 'flex-end',
        mb: 2,
        maxWidth: '100%',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: isAgent ? '#55acee' : '#ba68c8',
          color: 'white',
          borderRadius: 2,
          maxWidth: '80%',
        }}
      >
        <Box sx={{
          typography: 'body1',
          '& p': { m: 0, mb: 1 },
          '& p:last-child': { mb: 0 },
          '& pre': {
            overflow: 'auto',
            p: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 1
          }
        }}>
          {isLoading ? (
            'Analyzing your question...'
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </Box>
      </Paper>

      {/* Add visualization panel if available */}
      {visualization && !isLoading && (
        <Box sx={{ mt: 1, width: '100%', maxWidth: '100%' }}>
          <VisualizationPanel chartData={visualization} />
        </Box>
      )}
    </Box>
  );
}