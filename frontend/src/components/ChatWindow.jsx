import React from 'react';

export default function ChatWindow({ messages }) {
    return (
        <div className="chat-window">
            {messages.map((msg, idx) => (
                <div key={idx} className={msg.sender}>
                    <b>{msg.sender === 'user' ? 'You' : 'Agent'}:</b> {msg.text}
                </div>
            ))}
        </div>
    );
}
