import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import agentRoutes from './src/routes/agentRoutes.js';
import logger from './utils/logger.js';
import axios from 'axios';
import { handleAgentQuery } from './src/controllers/agentController.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL'
];

// Only require DATABASE_URL if individual DB params aren't set
if (!process.env.DATABASE_URL && !(process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME)) {
    requiredEnvVars.push('DATABASE_URL or DB_HOST+DB_USER+DB_PASSWORD+DB_NAME');
}

const missingEnvVars = requiredEnvVars.filter(varName => {
    if (varName.includes(' or ')) {
        const [option1, option2] = varName.split(' or ');
        const option2Parts = option2.split('+');
        return !process.env[option1] && !(option2Parts.every(part => process.env[part]));
    }
    return !process.env[varName];
});

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Log configuration
console.log("Environment variables loaded:");
console.log(`- OpenRouter Model: ${process.env.OPENROUTER_MODEL}`);
console.log(`- DB Host: ${process.env.DATABASE_URL ? 'Set via URL' : (process.env.DB_HOST || 'Not set')}`);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: [
        'https://ai-chatbot-five-flame.vercel.app',
        'http://localhost:5173',
        'https://ai-chatbot-five-flame.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
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
            model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1:free",
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

// Direct route handler for /ask (without /api prefix)
app.post('/ask', async (req, res) => {
    try {
        return handleAgentQuery(req, res);
    } catch (error) {
        console.error('Error in /ask route:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Add a health check endpoint that returns a 200 status
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Optional: Add a redirect for root path
app.get('/', (req, res) => {
    res.redirect('https://ai-chatbot-five-flame.vercel.app/');
});

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