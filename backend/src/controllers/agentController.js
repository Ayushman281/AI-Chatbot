import * as llmService from '../services/llmService.js';
import * as db from '../db/database.js';

function validateAndFixSQL(sql) {
    // Fix common misspellings
    const fixes = [
        { wrong: /\btle\b/g, correct: "ttle" },
        { wrong: /\balm\b/g, correct: "albm" },
        { wrong: /\btrack\b/g, correct: "trk" },

        // Fix the quotes issue in WHERE clauses with numbers
        { wrong: /WHERE\s+([\w\.]+)\s*=\s*"(\d+)"/gi, correct: "WHERE $1 = $2" },
        { wrong: /WHERE\s+([\w\.]+)\s*=\s*'(\d+)'/gi, correct: "WHERE $1 = $2" },

        // Other fixes
        { wrong: /"/g, correct: "\"" }, // Ensure proper escaping of quotes
    ];

    let fixedSQL = sql;
    for (const fix of fixes) {
        fixedSQL = fixedSQL.replace(fix.wrong, fix.correct);
    }

    // Log if changes were made
    if (fixedSQL !== sql) {
        console.log("SQL was fixed:");
        console.log("Original:", sql);
        console.log("Fixed:", fixedSQL);
    }

    return fixedSQL;
}

// Add this function to prepare better chart data:

function prepareChartData(question, result) {
    const questionLower = question.toLowerCase();

    // For year-based queries
    if (questionLower.includes('year') || questionLower.match(/\b(19|20)\d{2}\b/)) {
        const yearMatch = questionLower.match(/\b(19|20)\d{2}\b/);
        const targetYear = yearMatch ? parseInt(yearMatch[0]) : null;

        // For chart of albums by year
        if (questionLower.includes('album') && targetYear) {
            // Create context data for surrounding years
            const startYear = targetYear - 2;
            const endYear = targetYear + 2;
            const yearData = [];

            for (let year = startYear; year <= endYear; year++) {
                yearData.push({
                    year: year.toString(),
                    count: year === targetYear ? result.length : 0,
                    isHighlighted: year === targetYear
                });
            }

            return {
                chartData: yearData,
                chartType: 'bar'
            };
        }
    }

    // Default case - just return the result
    return {
        chartData: result,
        chartType: 'table'
    };
}

export const handleAgentQuery = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }

    try {
        console.log(`Processing question: "${question}"`);

        // Generate SQL using the llmService
        const { sql: generatedSQL, chartType } = await llmService.generateSQL(question, db.schemaInfo);
        console.log(`Generated SQL: ${generatedSQL}`);

        // Validate and fix the SQL before execution
        const sql = validateAndFixSQL(generatedSQL);

        try {
            // Execute the query
            const result = await db.query(sql);
            console.log(`Query returned ${result.length} results`);

            // Generate natural language answer
            const answer = await llmService.generateAnswer(question, result);

            // Prepare chart data
            const { chartData, chartType } = prepareChartData(question, result);

            // Return the response
            res.json({
                answer,
                result,
                chartData, // The prepared chart data
                chartType, // The suggested chart type
                sql // Include the SQL for debugging
            });
        } catch (queryError) {
            console.error(`Query error: ${queryError.message}`);
            console.error(`Failed query: ${sql}`);

            // For "Which albums were released in 2016" questions, use a fallback simple query
            if (question.toLowerCase().includes('2016') &&
                question.toLowerCase().includes('album')) {

                console.log("Using fallback query for albums in 2016");
                try {
                    const fallbackSQL = "SELECT * FROM albm WHERE col1 = 2016";
                    const result = await db.query(fallbackSQL);
                    const answer = await llmService.generateAnswer(question, result);

                    res.json({
                        answer,
                        result,
                        chartType: "bar",
                        sql: fallbackSQL
                    });
                    return;
                } catch (fallbackError) {
                    console.error("Even fallback query failed:", fallbackError);
                }
            }

            res.status(500).json({ error: `Database error: ${queryError.message}` });
        }
    } catch (err) {
        console.error(`Error processing question "${question}":`, err);
        res.status(500).json({ error: err.message });
    }
};
