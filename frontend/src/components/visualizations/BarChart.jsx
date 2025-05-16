import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

const CustomBarChart = ({ data }) => {
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
      // Only use numeric values for bars
      typeof chartData[0][key] === 'number'
    );

    return { xAxisKey, dataKeys };
  }, [chartData]);

  // Custom colors for bars
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
        <BarChart
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
            <Bar 
              key={key}
              dataKey={key} 
              fill={colors[index % colors.length]} 
              name={key}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomBarChart;