import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import AnswerDisplay from './components/AnswerDisplay';

export default function App() {
    const [messages, setMessages] = useState([]);
    const [answer, setAnswer] = useState('');
    const [result, setResult] = useState([]);
    const [chartType, setChartType] = useState('table');

    const handleSend = async (question) => {
        setMessages([...messages, { sender: 'user', text: question }]);
        const res = await fetch('http://localhost:5000/api/agent/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        const data = await res.json();
        setAnswer(data.answer);
        setResult(data.result);
        setChartType(data.chartType);
        setMessages(msgs => [...msgs, { sender: 'agent', text: data.answer }]);
    };

    return (
        <div className="app-container">
            <h1>AI Data Agent</h1>
            <ChatWindow messages={messages} />
            <ChatInput onSend={handleSend} />
            <AnswerDisplay answer={answer} result={result} chartType={chartType} />
        </div>
    );
}
