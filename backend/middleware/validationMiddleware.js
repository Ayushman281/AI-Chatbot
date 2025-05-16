import { z } from 'zod';
import logger from '../utils/logger.js';

// Schema for query request validation
const queryRequestSchema = z.object({
    question: z.string().min(1, 'Question is required').max(1000, 'Question too long'),
    conversationId: z.string().optional()
});

// Validation middleware for query requests
const validateQueryRequest = (req, res, next) => {
    try {
        const validated = queryRequestSchema.parse(req.body);
        req.body = validated;
        next();
    } catch (error) {
        logger.error('Validation error:', error);
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
};

export {
    validateQueryRequest
};
