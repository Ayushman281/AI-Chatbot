import React from 'react';
import { Box } from '@mui/material';

export default function DatabaseIcon({ color = 'currentColor', size = 24, sx = {} }) {
    return (
        <Box
            component="svg"
            sx={{
                width: size,
                height: size,
                ...sx
            }}
            viewBox="0 0 24 24"
        >
            <path
                fill={color}
                d="M12,3C7.58,3 4,4.79 4,7V17C4,19.21 7.59,21 12,21C16.41,21 20,19.21 20,17V7C20,4.79 16.42,3 12,3M12,5C16.08,5 18,6.37 18,7C18,7.63 16.08,9 12,9C7.92,9 6,7.63 6,7C6,6.37 7.92,5 12,5M6,9.53C7.79,10.5 9.86,11 12,11C14.14,11 16.21,10.5 18,9.53V13.5C18,14.13 16.08,15.5 12,15.5C7.92,15.5 6,14.13 6,13.5V9.53M6,12.53C7.79,13.5 9.86,14 12,14C14.14,14 16.21,13.5 18,12.53V17C18,17.63 16.08,19 12,19C7.92,19 6,17.63 6,17V12.53Z"
            />
        </Box>
    );
}