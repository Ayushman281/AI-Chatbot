import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';

const COLORS = ['#36c5f0', '#2EB67D', '#ECB22E', '#E01E5A', '#8c52ff'];
const HIGHLIGHT_COLOR = '#ff6b6b';

export default function ChartDisplay({ data, type, question }) {
    const prepareChartData = () => {
        if (!data || data.length === 0) return [];

        // For count-based results (like "how many albums in 2016")
        if (type === 'number' && data.length >= 1) {
            // If we have a count column, use it
            if (data[0].count !== undefined || data[0].total_count !== undefined) {
                const count = data[0].count || data[0].total_count;
                return [{
                    name: 'Count',
                    value: parseInt(count)
                }];
            }

            // For specific year queries, create a more detailed chart
            if (question?.toLowerCase().includes('2016') ||
                question?.toLowerCase().includes('year')) {

                return data.map(item => {
                    // Find the title field (could be 'ttle', 'album_title', etc.)
                    const titleField = Object.keys(item).find(key =>
                        key === 'ttle' || key === 'album_title' ||
                        key.toLowerCase().includes('title')
                    ) || Object.keys(item)[0];

                    return {
                        name: item[titleField] || 'Unknown Album',
                        value: 1  // Each album counts as 1
                    };
                });
            }
        }

        // Regular case for multiple items
        const numericColumns = Object.keys(data[0]).filter(key =>
            typeof data[0][key] === 'number' &&
            !key.toLowerCase().includes('id')  // Skip IDs
        );

        const textColumns = Object.keys(data[0]).filter(key =>
            typeof data[0][key] === 'string' ||
            key === 'ttle' ||
            key.toLowerCase().includes('title') ||
            key.toLowerCase().includes('name')
        );

        const valueKey = numericColumns[0] || 'value';
        const labelKey = textColumns[0] || Object.keys(data[0])[0];

        return data.map(item => ({
            name: item[labelKey] || 'Unknown',
            value: parseFloat(item[valueKey]) || 1
        }));
    };

    const renderChart = () => {
        if (!data || data.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No data available to visualize
                    </Typography>
                </Box>
            );
        }

        const chartData = prepareChartData();

        if (chartData.length === 0) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        Could not generate meaningful chart from this data
                    </Typography>
                </Box>
            );
        }

        // For 2016 albums case or similar "how many X" questions
        const isCountQuestion = question?.toLowerCase().includes('how many');
        const isYearQuestion = question?.toLowerCase().includes('year') ||
            /\b(19|20)\d{2}\b/.test(question || '');

        // Choose appropriate chart
        let chartType = type;
        if (isCountQuestion && chartData.length === 1) {
            chartType = 'number';  // Show a single number for count questions with one result
        } else if (isYearQuestion && chartData.length <= 5) {
            chartType = 'bar';  // Bar chart for year questions with few results
        } else if (chartData.length > 10) {
            chartType = chartType === 'pie' ? 'bar' : chartType;  // Avoid pie charts for many results
        }

        // Render based on chart type
        switch (chartType) {
            case 'number':
                return (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3
                    }}>
                        <Typography variant="h1" color="primary" sx={{ fontSize: '5rem', fontWeight: 'bold' }}>
                            {chartData[0]?.value || 0}
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {getChartTitle(question, chartData)}
                        </Typography>
                    </Box>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                tick={{ fill: '#666' }}
                            >
                                <Label
                                    value={getXAxisLabel(question)}
                                    position="bottom"
                                    style={{ textAnchor: 'middle', fill: '#666' }}
                                    offset={50}
                                />
                            </XAxis>
                            <YAxis tick={{ fill: '#666' }}>
                                <Label
                                    value={getYAxisLabel(question)}
                                    position="left"
                                    angle={-90}
                                    style={{ textAnchor: 'middle', fill: '#666' }}
                                    offset={-10}
                                />
                            </YAxis>
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend wrapperStyle={{ paddingTop: 10 }} />
                            <Bar
                                dataKey="value"
                                fill={HIGHLIGHT_COLOR}
                                name={getSeriesLabel(question)}
                                barSize={60}
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                tick={{ fill: '#666' }}
                            >
                                <Label
                                    value={getXAxisLabel(question)}
                                    position="bottom"
                                    style={{ textAnchor: 'middle', fill: '#666' }}
                                    offset={50}
                                />
                            </XAxis>
                            <YAxis tick={{ fill: '#666' }}>
                                <Label
                                    value={getYAxisLabel(question)}
                                    position="left"
                                    angle={-90}
                                    style={{ textAnchor: 'middle', fill: '#666' }}
                                    offset={-10}
                                />
                            </YAxis>
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                                name={getSeriesLabel(question)}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            default:
                return (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="text.secondary">
                            Table view is available in the Table tab
                        </Typography>
                    </Box>
                );
        }
    };

    // Helper functions for chart labels
    const getXAxisLabel = (question) => {
        if (!question) return "Category";

        if (question.toLowerCase().includes('album')) return "Album";
        if (question.toLowerCase().includes('artist')) return "Artist";
        if (question.toLowerCase().includes('track') || question.toLowerCase().includes('song')) return "Track";
        if (question.toLowerCase().includes('year')) return "Year";

        return "Category";
    };

    const getYAxisLabel = (question) => {
        if (!question) return "Value";

        if (question.toLowerCase().includes('how many')) return "Count";
        if (question.toLowerCase().includes('price') || question.toLowerCase().includes('cost')) return "Price ($)";
        if (question.toLowerCase().includes('popular') || question.toLowerCase().includes('top')) return "Count";

        return "Value";
    };

    const getSeriesLabel = (question) => {
        if (!question) return "Value";

        if (question.toLowerCase().includes('how many')) return "Count";
        if (question.toLowerCase().includes('price') || question.toLowerCase().includes('cost')) return "Price";
        if (question.toLowerCase().includes('popular')) return "Popularity";

        return "Value";
    };

    const getChartTitle = (question, data) => {
        if (!question) return "";

        if (question.toLowerCase().includes('how many') && question.toLowerCase().includes('album')) {
            return `Number of Albums${question.toLowerCase().includes('2016') ? ' in 2016' : ''}`;
        }

        if (question.toLowerCase().includes('how many') && question.toLowerCase().includes('track')) {
            return "Number of Tracks";
        }

        return "";
    };

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            {renderChart()}
        </Box>
    );
}