import express from 'express';
import { handleAgentQuery } from '../controllers/agentController.js';

const router = express.Router();

// This will be accessible at /api/ask
router.post('/ask', handleAgentQuery);

export default router;
