import React, { useState } from 'react';

export default function ChatInput({ onSend }) {
    const [input, setInput] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input);
            setInput('');
        }
    };
    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a business question..."
            />
            <button type="submit">Send</button>
        </form>
    );
}
