import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { SendHorizontal, Loader2 } from 'lucide-react';

const QueryInput = ({
  onSubmit,
  isLoading,
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Focus the input field when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (query.trim() && !isLoading && !disabled) {
      onSubmit(query);
      setQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      component={Paper}
      elevation={2}
      sx={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Ask a question about your data..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || disabled}
          multiline
          maxRows={4}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              px: 2,
              py: 1,
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#4a154b',
                borderWidth: 2,
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Send message">
                  <span style={{ display: 'inline-block' }}>
                    <IconButton
                      color="primary"
                      onClick={handleSubmit}
                      disabled={!query.trim() || isLoading || disabled}
                      edge="end"
                      sx={{
                        bgcolor: '#4a154b',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: '#3b1139',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#e0e0e0',
                          color: '#9e9e9e',
                        },
                        transition: 'all 0.2s',
                        transform: query.trim() ? 'scale(1)' : 'scale(0.9)',
                        ml: 1,
                      }}
                    >
                      {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <SendHorizontal size={20} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box
        sx={{
          mt: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.7
        }}
      >
        <small style={{ fontSize: '0.75rem', color: theme.palette.text.secondary }}>
          {isMobile ? 'Tap to send' : 'Press Enter to send, Shift+Enter for new line'}
        </small>
      </Box>
    </Box>
  );
};

export default QueryInput;