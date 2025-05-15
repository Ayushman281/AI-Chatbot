const llmService = require('../services/llmService');
const db = require('../db/database');

exports.handleAgentQuery = async (req, res) => {
    const { question } = req.body;
    try {
        const { sql, chartType } = await llmService.generateSQL(question, db.schemaInfo);
        const result = await db.query(sql);
        const answer = await llmService.generateAnswer(question, result);

        res.json({ answer, result, chartType });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
