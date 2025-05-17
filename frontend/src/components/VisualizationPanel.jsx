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

  // Determine if we should show a chart based on the data and question
  const showChartTab = () => {
    // No data, no chart
    if (!result || result.length === 0) return false;

    // Forced table view
    if (chartType === 'table') return false;

    // Single result with count = 0
    if (result.length === 1 && Object.values(result[0]).some(val => val === 0)) {
      return false;
    }

    // For "how many" questions with single result, show number visualization
    if (question?.toLowerCase().includes('how many') && result.length === 1) {
      return true;
    }

    // For year-specific queries (like albums in 2016)
    if (/\b(19|20)\d{2}\b/.test(question || '') && result.length > 0) {
      return true;
    }

    return true;
  };

  // Choose best chart type based on data and question
  const getBestChartType = () => {
    if (!chartType || chartType === 'table') {
      // Auto-select chart type based on question
      const lowerQuestion = question?.toLowerCase() || '';

      if (lowerQuestion.includes('how many')) {
        return result.length === 1 ? 'number' : 'bar';
      }

      if (lowerQuestion.includes('compare') || lowerQuestion.includes('trend')) {
        return 'line';
      }

      if (lowerQuestion.includes('distribution') || lowerQuestion.includes('breakdown')) {
        return 'pie';
      }

      // Default to bar chart for most queries
      return 'bar';
    }

    return chartType;
  };

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
        {showChartTab() && <Tab label="Chart" value="visualization" />}
        <Tab label="Table" value="table" />
        {sql && <Tab label="SQL Query" value="sql" />}
      </Tabs>

      {activeTab === 'visualization' && showChartTab() && (
        <ChartDisplay
          data={result}
          type={getBestChartType()}
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