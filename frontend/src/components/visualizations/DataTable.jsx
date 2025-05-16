import React, { useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography 
} from '@mui/material';

const DataTable = ({ data }) => {
  // Determine column headers from the first data item
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 2, overflow: 'hidden' }}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 400,
          boxShadow: 2,
          borderRadius: 2,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column}
                  sx={{ 
                    fontWeight: 'bold',
                    backgroundColor: '#4a154b',
                    color: 'white',
                  }}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{ 
                  '&:nth-of-type(odd)': { 
                    backgroundColor: 'rgba(0, 0, 0, 0.02)' 
                  },
                  '&:hover': { 
                    backgroundColor: 'rgba(54, 197, 240, 0.08)' 
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                {columns.map((column) => (
                  <TableCell key={`${rowIndex}-${column}`}>
                    {row[column] !== null && row[column] !== undefined ? row[column].toString() : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DataTable;