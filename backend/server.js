// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import agentRoutes from './src/routes/agentRoutes.js';
import logger from './utils/logger.js';

dotenv.config();
console.log("Environment variables loaded:");
console.log(`- Ollama URL: ${process.env.OLLAMA_BASE_URL}`);
console.log(`- Ollama Model: ${process.env.OLLAMA_MODEL}`);
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

// Routes
app.use('/api', agentRoutes);  // This maps /api/ask to the handleAgentQuery controller

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
