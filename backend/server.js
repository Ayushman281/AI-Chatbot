// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import agentRoutes from './src/routes/agentRoutes.js';
import logger from './utils/logger.js';
import axios from 'axios';

dotenv.config();
console.log("Environment variables loaded:");
console.log(`- DeepSeek Model: ${process.env.OPENROUTER_MODEL}`);
console.log(`- DB Host: ${process.env.DB_HOST}`);
console.log(`- DB User: ${process.env.DB_USER}`);

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Add a test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running!' });
});

// Simple test endpoint that doesn't require OpenRouter
app.get('/test-model', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is running correctly',
        dbConnected: true,
        timestamp: new Date().toISOString()
    });
});

// OpenRouter test endpoint
app.get('/api/test-model', async (req, res) => {
    try {
        // Use your hardcoded API key from the previous fix
        const API_KEY = "YOUR_OPENROUTER_API_KEY_HERE"; // Replace with actual key

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "tngtech/deepseek-r1t-chimera:free",
            messages: [{ role: 'user', content: 'Say hello' }]
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({
            status: 'success',
            response: response.data.choices[0].message.content
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            details: error.response?.data
        });
    }
});

// Routes
app.use('/api', agentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server with error handling
try {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        logger.info(`Server running on port ${PORT}`);
    });
} catch (err) {
    console.error('Failed to start server:', err);
    logger.error('Failed to start server:', err);
}
