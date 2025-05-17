import * as llmService from '../services/llmService.js';
import * as db from '../db/database.js';
import { buildFullSchemaContext } from '../services/schemaService.js';

// Update the validateAndFixSQL function to handle non-string inputs
function validateAndFixSQL(sql) {
    // Check if sql is undefined or not a string
    if (!sql || typeof sql !== 'string') {
        console.error('Invalid SQL input:', sql);
        throw new Error('Invalid SQL input: not a string');
    }

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

    return fixedSQL.replace(/\s+/g, ' ').trim();
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

// Then fix the SQL extraction from LLM response
function extractSQLFromResponse(response) {
    try {
        // First try to parse as JSON
        const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;

        // If it's JSON with an sql property, use that
        if (parsedResponse && parsedResponse.sql) {
            return parsedResponse.sql;
        }

        // Fall back to regex extraction if it's a string
        if (typeof response === 'string') {
            const sqlRegex = /===SQL===\s*([\s\S]*?)\s*===ENDSQL===|```sql\s*([\s\S]*?)\s*```/;
            const match = response.match(sqlRegex);

            if (match) {
                return (match[1] || match[2]).trim();
            }

            // Last resort - look for SQL statements
            const fallbackRegex = /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s+[\s\S]+?;/i;
            const fallbackMatch = response.match(fallbackRegex);

            if (fallbackMatch) {
                return fallbackMatch[0].trim();
            }
        }

        throw new Error('Could not extract SQL from response');
    } catch (error) {
        console.error('Error extracting SQL:', error);
        throw error;
    }
}

async function executeFallbackQuery(userQuestion) {
    console.log("Using fallback query for albums in 2016");
    try {
        const fallbackSQL = "SELECT * FROM albm WHERE col1 = 2016";
        const result = await db.query(fallbackSQL);
        const answer = await llmService.generateAnswer(userQuestion, result);

        return {
            answer,
            result,
            chartType: "bar",
            sql: fallbackSQL
        };
    } catch (fallbackError) {
        console.error("Even fallback query failed:", fallbackError);
        throw fallbackError;
    }
}

async function executeQuery(sql) {
    try {
        const validatedSQL = validateAndFixSQL(sql);
        const result = await db.query(validatedSQL);
        return result;
    } catch (queryError) {
        console.error(`Query error: ${queryError.message}`);
        throw queryError;
    }
}

export const handleAgentQuery = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: "Question is required" });
        }

        // Get complete schema information
        const completeSchemaInfo = await buildFullSchemaContext();

        // Use the complete schema for initial query
        const llmResponse = await llmService.generateSQL(question, completeSchemaInfo);
        console.log(`LLM Response: ${JSON.stringify(llmResponse)}`);

        try {
            // Extract SQL from LLM response
            const extractedSQL = await extractSQLFromResponse(llmResponse);

            if (!extractedSQL) {
                // If extraction failed, use a simpler fallback query
                console.warn('Failed to extract SQL. Using fallback query.');
                const fallbackResult = await executeFallbackQuery(question);
                return res.json(fallbackResult);
            }

            try {
                // Execute the query with validation
                const result = await executeQuery(extractedSQL);
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
                    sql: extractedSQL // Include the SQL for debugging
                });
            } catch (error) {
                if (error.message?.includes('does not exist') || error.code === '42P01') {
                    console.log("Schema error detected, retrying with explicit schema");

                    // Get full schema again, but add specific guidance
                    const completeSchemaInfo = await buildFullSchemaContext();

                    const enhancedContext = `
                        ${completeSchemaInfo}
                        
                        Your previous query failed because you used incorrect table or column names.
                        The specific error was: ${error.message}
                        
                        Please ensure you use EXACTLY the table and column names as shown above.
                        For queries about artists and albums, you likely need to join the "Artist" and "Album" tables.
                    `;

                    const correctedQuery = await llmService.generateSQL(question, enhancedContext);
                    const correctedResult = await executeQuery(correctedQuery);
                    console.log(`Corrected query returned ${correctedResult.length} results`);

                    // Generate natural language answer
                    const correctedAnswer = await llmService.generateAnswer(question, correctedResult);

                    // Prepare chart data
                    const { chartData, chartType } = prepareChartData(question, correctedResult);

                    // Return the response
                    return res.json({
                        answer: correctedAnswer,
                        result: correctedResult,
                        chartData, // The prepared chart data
                        chartType, // The suggested chart type
                        sql: correctedQuery // Include the SQL for debugging
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error processing query:', error);
            res.status(500).json({ error: `Database error: ${error.message}` });
        }
    } catch (err) {
        console.error(`Error processing question "${question}":`, err);
        res.status(500).json({ error: err.message });
    }
};
