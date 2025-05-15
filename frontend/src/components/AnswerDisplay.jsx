import React from 'react';
import TableDisplay from './TableDisplay';
import ChartDisplay from './ChartDisplay';

export default function AnswerDisplay({ answer, result, chartType }) {
    if (!answer) return null;
    return (
        <div className="answer-display">
            <div className="answer-text">{answer}</div>
            {chartType === 'table' && <TableDisplay data={result} />}
            {chartType !== 'table' && <ChartDisplay data={result} type={chartType} />}
        </div>
    );
}
