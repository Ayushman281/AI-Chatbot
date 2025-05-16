import React, { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';

const CustomPieChart = ({ data }) => {
  const theme = useTheme();

  // Format and prepare data for visualization
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get keys from the first data item
    const keys = Object.keys(data[0]);
    
    // Assuming the first column is the name/category and the second is the value
    const nameKey = keys[0];
    const valueKey = keys.find(key => typeof data[0][key] === 'number') || keys[1];
    
    return data.map(item => ({
      name: item[nameKey],
      value: item[valueKey]
    }));
  }, [data]);

  // Custom colors for pie slices
  const COLORS = ['#36c5f0', '#2EB67D', '#ECB22E', '#E01E5A', '#8c52ff', '#00C6AE', '#4F5DFF', '#8661C5'];

  // Custom rendering for the labels
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      percent > 0.05 ? (
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      ) : null
    );
  };

  if (chartData.length === 0) {
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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke={theme.palette.background.paper}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}`, 'Value']}
            contentStyle={{ 
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.divider,
              borderRadius: 4,
              boxShadow: theme.shadows[3],
            }}
          />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ paddingLeft: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CustomPieChart;