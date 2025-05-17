import express from 'express';
import dataAgent from '../../services/data-agent-service.js';
import logger from '../../utils/logger.js';
import { validateQueryRequest } from '../../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/query
 * @description Process a natural language query against the database
 * @access Public
 */
router.post('/', validateQueryRequest, async (req, res) => {
    try {
        const { question, conversationId } = req.body;

        // Get conversation context if available
        let conversationContext = [];
        if (conversationId && req.session.conversations) {
            conversationContext = req.session.conversations[conversationId] || [];
        }

        // Process the query
        const result = await dataAgent.processQuery(question, conversationContext);

        // Update conversation context
        if (conversationId) {
            if (!req.session.conversations) {
                req.session.conversations = {};
            }

            if (!req.session.conversations[conversationId]) {
                req.session.conversations[conversationId] = [];
            }

            // Add this exchange to the conversation
            req.session.conversations[conversationId].push({
                question,
                sql: result.sql,
                timestamp: new Date()
            });

            // Limit conversation history
            if (req.session.conversations[conversationId].length > 10) {
                req.session.conversations[conversationId].shift();
            }
        }

        res.json({
            success: true,
            data: {
                question: result.question,
                sql: result.sql,
                response: result.response,
                visualization: result.visualization,
                results: result.results.slice(0, 100), // Limit results sent to client
                totalRows: result.results.length
            }
        });
    } catch (error) {
        logger.error('Error processing query:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while processing your question'
        });
    }
});

/**
 * @route POST /api/query/explain
 * @description Get explanation for how a SQL query was generated
 * @access Public
 */
router.post('/explain', async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({
                success: false,
                error: 'SQL query is required'
            });
        }

        // Generate explanation for SQL query
        const explanation = await dataAgent.explainSQL(sql);

        res.json({
            success: true,
            data: {
                sql,
                explanation
            }
        });
    } catch (error) {
        logger.error('Error explaining SQL query:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while explaining the SQL query'
        });
    }
});

/**
 * @route GET /api/query/schema
 * @description Get database schema information
 * @access Public
 */
router.get('/schema', async (req, res) => {
    try {
        // Initialize data agent if not already
        if (!dataAgent.initialized) {
            await dataAgent.initialize();
        }

        const schemaInfo = await dataAgent.getSchemaInfo();

        res.json({
            success: true,
            data: schemaInfo
        });
    } catch (error) {
        logger.error('Error fetching schema information:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred while fetching schema information'
        });
    }
});

/**
 * @route GET /api/query/test
 * @description Test database connection and verify data exists
 * @access Public
 */
router.get('/test', async (req, res) => {
    try {
        // Initialize data agent if not already
        if (!dataAgent.initialized) {
            await dataAgent.initialize();
        }

        // Run test queries to verify key tables have data
        const tests = [
            { table: 'albm', query: 'SELECT COUNT(*) FROM albm' },
            { table: 'trk', query: 'SELECT COUNT(*) FROM trk' },
            { table: 'artist', query: 'SELECT COUNT(*) FROM artist' }
        ];

        const results = {};
        for (const test of tests) {
            const result = await db.query(test.query);
            results[test.table] = parseInt(result.rows[0].count);
        }

        // Sample data for each table
        const samples = {};
        if (results.albm > 0) {
            samples.albm = await db.query('SELECT AlbumId, ttle, col1 FROM albm LIMIT 3');
        }
        if (results.trk > 0) {
            samples.trk = await db.query('SELECT TrackNo, TrackTitle FROM trk LIMIT 3');
        }
        if (results.artist > 0) {
            samples.artist = await db.query('SELECT ArtistIdentifier, NM FROM artist LIMIT 3');
        }

        res.json({
            success: true,
            counts: results,
            samples: samples
        });
    } catch (error) {
        logger.error('Error testing database:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'An error occurred testing the database'
        });
    }
});

export default router;
