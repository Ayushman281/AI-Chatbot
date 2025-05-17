import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import agentRoutes from './src/routes/agentRoutes.js';
import logger from './utils/logger.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log configuration
console.log("Environment variables loaded:");
console.log(`- OpenRouter Model: ${process.env.OPENROUTER_MODEL}`);
console.log(`- DB Host: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:5173',
    credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Basic test endpoint
app.get('/test', (req, res) => {
    res.json({ status: 'Server is running!' });
});

// OpenRouter test endpoint
app.get('/api/test-model', async (req, res) => {
    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: process.env.OPENROUTER_MODEL || "tngtech/deepseek-r1t-chimera:free",
            messages: [{ role: 'user', content: 'Say hello' }]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
    res.status(500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
try {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        logger.info(`Server running on port ${PORT}`);
    });
} catch (err) {
    console.error('Failed to start server:', err);
    logger.error('Failed to start server:', err);
}

export default app;