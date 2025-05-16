import React from 'react';
import { Box } from '@mui/material';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
const HIGHLIGHT_COLOR = '#ff6b6b';

export default function ChartDisplay({ data, type, question }) {
    const prepareChartData = () => {
        if (!data || data.length === 0) return [];

        // For zero results, don't show chart
        if (data.length === 1 && Object.values(data[0]).some(val => val === 0)) {
            return [];
        }

        // For single-item results
        if (data.length === 1) {
            const nameField = Object.keys(data[0]).find(key =>
                key === 'ttle' || key.toLowerCase().includes('title') || key.toLowerCase().includes('name')
            ) || Object.keys(data[0])[0];

            return [{
                name: data[0][nameField] || 'Result',
                value: 1
            }];
        }

        // Regular case for multiple items
        const numericColumns = Object.keys(data[0]).filter(key =>
            typeof data[0][key] === 'number' && key !== 'albumid' && key !== 'a_id'
        );

        const textColumns = Object.keys(data[0]).filter(key =>
            typeof data[0][key] === 'string' || key === 'ttle'
        );

        const valueKey = numericColumns[0] || 'col1';
        const labelKey = textColumns[0] || Object.keys(data[0])[0];

        return data.map(item => ({
            name: item[labelKey] || 'Unknown',
            value: item[valueKey] || 0
        }));
    };

    const renderChart = () => {
        if (!data || data.length === 0) {
            return <div>No data available to visualize</div>;
        }

        const chartData = prepareChartData();

        if (chartData.length === 0) {
            return <div>No chart data available for this result</div>;
        }

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis
                                dataKey="name"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis />
                            <Tooltip
                                cursor={{
                                    fill: 'transparent',
                                    stroke: '#ccc',
                                    strokeWidth: 1,
                                    strokeDasharray: '5 5'
                                }}
                                wrapperStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="value"
                                fill={HIGHLIGHT_COLOR}
                                name="Count"
                                barSize={60}
                                activeBar={{
                                    fill: '#c05050',
                                    stroke: '#333',
                                    strokeWidth: 1
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return <div>Table view is available in the Table tab</div>;
        }
    };

    return (
        <Box>
            {renderChart()}
        </Box>
    );
}