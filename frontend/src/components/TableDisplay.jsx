import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography
} from '@mui/material';

export default function TableDisplay({ data }) {
    if (!data || data.length === 0) {
        return (
            <Typography variant="body2" color="text.secondary">
                No data available to display.
            </Typography>
        );
    }

    // Extract column headers from the first data item
    const columns = Object.keys(data[0]);

    return (
        <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table stickyHeader size="small" aria-label="data table">
                <TableHead>
                    <TableRow>
                        {columns.map((column) => (
                            <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                                {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, ' ')}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {columns.map((column) => (
                                <TableCell key={`${rowIndex}-${column}`}>
                                    {row[column] !== null ? row[column].toString() : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}