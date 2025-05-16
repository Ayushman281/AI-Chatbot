import express from 'express';
import apiRoutes from './api/index.js';
import { handleAgentQuery } from '../src/controllers/agentController.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(200).json({ message: 'API root is working' });
});

// Add direct support for /api/ask endpoint that frontend expects
router.post('/ask', handleAgentQuery);

// Mount API routes at /v1
router.use('/v1', apiRoutes);

export default router;
