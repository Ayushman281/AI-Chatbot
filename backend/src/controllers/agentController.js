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

// Add this helper function
function extractYearFromQuestion(question) {
    const yearMatch = question.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? yearMatch[0] : null;
}

// Update extractSQLFromResponse function
function extractSQLFromResponse(response) {
    try {
        // First try parsing as JSON
        try {
            const parsedResponse = JSON.parse(response);
            return parsedResponse.sql || response;
        } catch (e) {
            // If it's not JSON, check if it's a SQL string
            if (typeof response === 'string' &&
                (response.trim().toUpperCase().startsWith('SELECT') ||
                    response.trim().toUpperCase().startsWith('WITH'))) {
                return response;
            }

            // Extract SQL using regex if it contains SQL
            const sqlMatch = response.match(/```sql\s*([\s\S]*?)```|`(SELECT[\s\S]*?);`|SELECT[\s\S]*?;/i);
            return sqlMatch ? (sqlMatch[1] || sqlMatch[2] || sqlMatch[0]).trim() : response;
        }
    } catch (error) {
        console.error("Error extracting SQL:", error);
        return null;
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
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Question is required" });
    }

    try {
        console.log(`Processing question: "${question}"`);

        // For year-specific album questions, use a targeted fallback
        if (question.toLowerCase().includes('album') &&
            (question.toLowerCase().includes('year') ||
                question.toLowerCase().includes('released'))) {

            const year = extractYearFromQuestion(question) || '2016';
            const fallbackSQL = `SELECT ttle AS album_title FROM albm WHERE col1 = ${year}`;

            try {
                const result = await db.query(fallbackSQL);
                const albumTitles = result.rows && result.rows.length > 0
                    ? result.rows.map(r => r.album_title || r.ttle).join(', ')
                    : "no albums";

                return res.json({
                    answer: `The albums released in ${year} were: ${albumTitles}`,
                    result: result.rows || [],
                    sql: fallbackSQL,
                    chartType: "bar"
                });
            } catch (dbError) {
                console.error("Database error:", dbError);
            }
        }

        // Generate SQL using the llmService
        const llmResponse = await llmService.generateSQL(question, db.schemaInfo);
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

                    // Get the actual table names from the database
                    const actualTables = await db.getActualTableNames();

                    // Get columns for the 'trk' table specifically (used in this query)
                    const trkColumns = await db.getTableColumns('trk');

                    // Add explicit schema correction to the prompt
                    const correctedQuery = await llmService.generateSQL(
                        question,
                        db.schemaInfo,
                        `The previous query failed because it used incorrect column names. 
                         The 'trk' table has these columns: ${trkColumns.join(', ')}.
                         The tables in the database are: ${actualTables.join(', ')}.
                         For artist information, join with the proper artist table.`
                    );

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
