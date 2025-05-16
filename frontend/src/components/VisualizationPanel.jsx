import React from 'react';
import { Box, Paper, Typography, Tab, Tabs } from '@mui/material';
import TableDisplay from './TableDisplay';
import ChartDisplay from './ChartDisplay';

export default function VisualizationPanel({ chartData }) {
  const [activeTab, setActiveTab] = React.useState('visualization');

  const { result, chartType, sql, question } = chartData || {};

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!result || result.length === 0) {
    return null;
  }

  // Don't show chart for zero results
  const showChartTab = chartType &&
    chartType !== 'table' &&
    result.length > 0 &&
    !question?.toLowerCase().includes('how many') &&
    !(result.length === 1 && Object.values(result[0]).some(val => val === 0));

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        my: 2,
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        Data Visualization
      </Typography>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="visualization tabs"
        sx={{ mb: 2 }}
      >
        {showChartTab && <Tab label="Chart" value="visualization" />}
        <Tab label="Table" value="table" />
        {sql && <Tab label="SQL Query" value="sql" />}
      </Tabs>

      {activeTab === 'visualization' && showChartTab && (
        <ChartDisplay
          data={result}
          type={chartType || 'bar'}
          question={question}
        />
      )}

      {activeTab === 'table' && (
        <TableDisplay data={result} />
      )}

      {activeTab === 'sql' && sql && (
        <Box sx={{
          backgroundColor: '#f5f5f5',
          p: 2,
          borderRadius: 1,
          fontFamily: 'monospace',
          overflow: 'auto'
        }}>
          <pre>{sql}</pre>
        </Box>
      )}
    </Paper>
  );
}