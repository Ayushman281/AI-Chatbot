import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

const CustomLineChart = ({ data }) => {
  const theme = useTheme();

  // Format and prepare data for visualization
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  // Dynamically determine chart keys
  const keys = useMemo(() => {
    if (chartData.length === 0) return [];
    
    // Get all keys from the first object
    const allKeys = Object.keys(chartData[0]);
    
    // Skip the first key as it's usually the x-axis category name
    const xAxisKey = allKeys[0];
    const dataKeys = allKeys.slice(1).filter(key => 
      // Only use numeric values for lines
      typeof chartData[0][key] === 'number'
    );

    return { xAxisKey, dataKeys };
  }, [chartData]);

  // Custom colors for lines
  const colors = ['#36c5f0', '#2EB67D', '#ECB22E', '#E01E5A', '#8c52ff'];

  if (chartData.length === 0 || keys.dataKeys.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400, mt: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey={keys.xAxisKey} 
            tick={{ fill: theme.palette.text.secondary }} 
            tickLine={{ stroke: theme.palette.divider }}
            axisLine={{ stroke: theme.palette.divider }}
          >
            <Label 
              value={keys.xAxisKey} 
              position="bottom" 
              fill={theme.palette.text.primary}
              style={{ textAnchor: 'middle', marginTop: '10px' }}
              offset={20}
            />
          </XAxis>
          <YAxis 
            tick={{ fill: theme.palette.text.secondary }}
            tickLine={{ stroke: theme.palette.divider }}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
              borderRadius: 4,
              boxShadow: theme.shadows[3],
            }}
          />
          <Legend 
            verticalAlign="top" 
            wrapperStyle={{ paddingBottom: 10 }}
          />
          {keys.dataKeys.map((key, index) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={colors[index % colors.length]} 
              name={key}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              animationDuration={1500}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomLineChart;