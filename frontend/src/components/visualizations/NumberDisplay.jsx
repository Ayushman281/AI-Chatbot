import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const NumberDisplay = ({ value, label }) => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                height: '100%',
                minHeight: 200,
            }}
        >
            <Typography
                variant="h1"
                sx={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                }}
            >
                {value}
            </Typography>

            {label && (
                <Typography
                    variant="h6"
                    sx={{
                        mt: 2,
                        color: theme.palette.text.secondary,
                        textAlign: 'center'
                    }}
                >
                    {label}
                </Typography>
            )}
        </Box>
    );
};

export default NumberDisplay;