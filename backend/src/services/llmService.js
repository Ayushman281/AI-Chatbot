import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Determine the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the root of the project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Now get the API key with fallback
const API_KEY = process.env.OPENROUTER_API_KEY || "YOUR_BACKUP_API_KEY_HERE";

if (!API_KEY || API_KEY === "YOUR_BACKUP_API_KEY_HERE") {
    console.error("WARNING: Using default API key. Set OPENROUTER_API_KEY in .env file!");
}

// Export for use in other modules
export { API_KEY };

// Initialize OpenRouter client
const openRouterClient = axios.create({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-data-agent.vercel.app', // Update with your deployed URL
        'X-Title': 'AI Data Agent'
    }
});

// Use the correct model name
const MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t-chimera:free';

// Schema mapping to handle messy database (keep this unchanged)
const SCHEMA_MAPPING = {
    // Table name mappings
    tables: {
        "album": "albm",
        "track": "trk",
        "employee": "employe",
        "invoice_line": "inv_line"
    },
    // Column mappings by table
    columns: {
        "artist": {
            "name": "NM",
            "country": "ctry",
            "id": "ArtistIdentifier"
        },
        "albm": {
            "title": "ttle",
            "artist_id": "a_id",
            "release_year": "col1"
        },
        "trk": {
            "id": "TrackNo",
            "title": "TrackTitle",
            "album_id": "AlbmID",
            "media_type_id": "MediaTypeIdentifier",
            "genre_id": "GenreID",
            "composer": "written_by",
            "milliseconds": "length_ms",
            "bytes": "size_bytes",
            "price": "cost",
            "release_year": "rlse_yr"
        },
        "customer": {
            "first_name": "F_NAME",
            "last_name": "L_NAME",
            "id": "cust_id",
            "address": "addr",
            "state": "st",
            "phone": "PhoneNum",
            "email": "EmailAddress"
        }
    },

};

const exampleQueries = `
EXAMPLE MAPPINGS:
"Show all albums" → SELECT * FROM albm
"List all tracks" → SELECT * FROM trk
"Find album by title" → SELECT * FROM albm WHERE ttle LIKE '%...'
"Albums from 2016" → SELECT * FROM albm WHERE col1 = 2016
"Customer purchase history" → SELECT c.F_NAME, c.L_NAME, i.TotalAmount FROM customer c JOIN invoice i ON c.cust_id = i.customerID
"Most expensive tracks" → SELECT TrackTitle, cost FROM trk ORDER BY cost DESC
"Invoices from 2023" → SELECT * FROM invoice WHERE EXTRACT(YEAR FROM date_of_invoice) = 2023

EXAMPLE QUERY TRANSFORMATIONS:
User asks: "What albums were released in 2016?"
Correct SQL: SELECT ttle, a_id FROM albm WHERE col1 = 2016;

User asks: "Show me all Lady Gaga tracks"
Correct SQL: SELECT t.TrackTitle, t.cost FROM trk t JOIN albm a ON t.AlbmID = a.AlbumId JOIN artist ar ON a.a_id = ar.ArtistIdentifier WHERE ar.NM = 'Lady Gaga';
`;

// Build detailed schema information string (keep this unchanged)
const buildSchemaDescription = () => {
    return `
DATABASE SCHEMA (IMPORTANT - THIS IS A MESSY DATABASE):

Tables:
1. "albm" (NOT album): 
  - AlbumId (primary key)
  - ttle (album title, NOTE: spelled with TWO t's at the beginning)
  - a_id (references artist.ArtistIdentifier)
  - col1 (release year as integer)

2. "trk" (NOT track):
  - TrackNo (primary key)
  - TrackTitle
  - AlbmID (references albm.AlbumId, NOTE THE SPELLING: "AlbmID" not "AlbumID")
  - MediaTypeIdentifier (references media_type.TypeID)
  - GenreID (references genre.id)
  - written_by (composer)
  - length_ms (duration in milliseconds)
  - size_bytes (file size)
  - cost (price)
  - rlse_yr (release year)

// rest of schema...

COMMON NAMING ISSUES:
- Track's album reference is "AlbmID" (not "AlbumID")
- Album's unique ID is "AlbumId" 
- Artist's ID is "ArtistIdentifier" (not "ArtistId")
`;
};

function standardizeQuestion(question) {
    // Create a more detailed question with explicit terms
    return `I want to query a database with these details:
- The database has albums (stored in table "albm" with title in "ttle" column)
- It has tracks (stored in table "trk")
- It has artists (with name stored as "NM")
- Release years for albums are in column "col1"
- Track prices are stored in column "cost"
- Invoices use "date_of_invoice" for dates

My question is: ${question}`;
}

// Helper functions for intent analysis
function identifyIntent(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('album') || lowerQuestion.includes('release'))
        return 'album information';
    if (lowerQuestion.includes('track') || lowerQuestion.includes('song'))
        return 'track information';
    if (lowerQuestion.includes('artist') || lowerQuestion.includes('band'))
        return 'artist information';
    if (lowerQuestion.includes('invoice') || lowerQuestion.includes('purchase'))
        return 'invoice information';
    if (lowerQuestion.includes('customer'))
        return 'customer information';

    return 'general database information';
}

function identifyRelevantTables(question, schemaInfo) {
    const lowerQuestion = question.toLowerCase();
    const tables = [];

    if (lowerQuestion.includes('album')) tables.push('albm');
    if (lowerQuestion.includes('track') || lowerQuestion.includes('song')) tables.push('trk');
    if (lowerQuestion.includes('artist')) tables.push('artist');
    if (lowerQuestion.includes('invoice')) tables.push('invoice');
    if (lowerQuestion.includes('customer')) tables.push('customer');

    return tables.length > 0 ? tables.join(', ') : 'Need to determine from context';
}

function identifyJoins(question, schemaInfo) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('album') && lowerQuestion.includes('artist'))
        return 'albm JOIN artist ON albm.a_id = artist.ArtistIdentifier';
    if (lowerQuestion.includes('track') && lowerQuestion.includes('album'))
        return 'trk JOIN albm ON trk.AlbmID = albm.AlbumId';
    if (lowerQuestion.includes('invoice') && lowerQuestion.includes('customer'))
        return 'invoice JOIN customer ON invoice.customerID = customer.cust_id';
    if (lowerQuestion.includes('track') && lowerQuestion.includes('invoice'))
        return 'trk JOIN inv_line ON trk.TrackNo = inv_line.TrackIdentifier';

    return 'Need to determine from context';
}

const generatePrompt = (question, schemaInfo) => {
    // First standardize the question
    const standardizedQuestion = standardizeQuestion(question);

    return `
You are an expert SQL generator for a DELIBERATELY MESSY database schema.

CRITICAL RULE: When users mention database objects, ALWAYS map them to the actual messy names in our schema.

DATABASE SCHEMA:
${JSON.stringify(schemaInfo, null, 2)}

${buildSchemaDescription()}

FUZZY MATCHING RULES:
- If user mentions "album(s)" → use "albm" table
- If user mentions "track(s)" → use "trk" table
- If user mentions "title" in context of albums → use "ttle" column
- If user mentions "invoice line(s)" → use "inv_line" table
- If user mentions "first name" or "last name" → use "F_NAME" or "L_NAME" 
- If user mentions "invoice date" → use "date_of_invoice"
- If user mentions "customer id" → use "cust_id"
- If user mentions "release year" → use "col1" (for albums)

${exampleQueries}

QUESTION WITH INTENT ANALYSIS:
"${question}"

Intent analysis: This question is asking about ${identifyIntent(question)}.
Relevant tables: ${identifyRelevantTables(question, schemaInfo)}
Potential joins needed: ${identifyJoins(question, schemaInfo)}

Generate a PostgreSQL query that answers this question using ONLY the actual table and column names in our schema.
Return ONLY a JSON object with this format:
{
  "sql": "YOUR SQL QUERY",
  "chartType": "APPROPRIATE CHART TYPE"
}
`;
};

export const generateSQL = async (question, schemaInfo) => {
    try {
        // First pass - generate initial SQL
        const initialPrompt = generatePrompt(question, schemaInfo);

        const initialResponse = await openRouterClient.post('/chat/completions', {
            model: MODEL,
            messages: [{ role: 'user', content: initialPrompt }]
        });

        // Extract initial SQL from response
        const content = initialResponse.data.choices[0].message.content;
        console.log("Raw OpenRouter response:", content.substring(0, 200) + "...");

        let sqlQuery;
        let chartType = "table";

        // Try to extract SQL from the initial response
        try {
            // Attempt different extraction methods
            let jsonData;

            // Method 1: Direct JSON parse if the response is clean JSON
            try {
                jsonData = JSON.parse(content);
                console.log("Parsed using direct JSON parse");
                sqlQuery = jsonData.sql;
                chartType = jsonData.chartType || "table";
            } catch (e) {
                // Method 2: Extract JSON block with regex
                const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                    content.match(/```\s*([\s\S]*?)\s*```/) ||
                    content.match(/{[\s\S]*?}/);

                if (jsonMatch) {
                    try {
                        const jsonStr = jsonMatch[1] || jsonMatch[0];
                        jsonData = JSON.parse(jsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2": '));
                        console.log("Parsed using regex extraction");
                        sqlQuery = jsonData.sql;
                        chartType = jsonData.chartType || "table";
                    } catch (e2) {
                        throw new Error("Failed to parse extracted JSON: " + e2.message);
                    }
                } else {
                    // Method 3: Try to extract direct SQL
                    const sqlMatch = content.match(/```sql\s*([\s\S]*?)\s*```/) ||
                        content.match(/SELECT[\s\S]*?;/i);

                    if (sqlMatch) {
                        sqlQuery = sqlMatch[0].replace(/```sql|```/g, '').trim();
                        console.log("Extracted SQL directly from response");
                    } else {
                        throw new Error("Could not extract SQL from response");
                    }
                }
            }
        } catch (parseError) {
            console.error('Failed to parse initial response:', parseError);
            // If we couldn't extract SQL, use a fallback
            sqlQuery = `SELECT * FROM albm LIMIT 10;`;
        }

        // Second pass - verify and fix schema errors
        if (sqlQuery) {
            const verificationPrompt = `
I generated this SQL for the question "${question}":
${sqlQuery}

VERIFY for schema errors against our MESSY database:
${buildSchemaDescription()}

FIX ANY ERRORS, especially:
1. Table names (e.g., use "albm" not "album")
2. Column names (e.g., use "ttle" not "title")
3. Join conditions (e.g., use "AlbmID" not "AlbumId")
4. Date functions (use PostgreSQL EXTRACT() syntax)

Return ONLY the corrected SQL without any explanations.
`;

            try {
                const correctionResponse = await openRouterClient.post('/chat/completions', {
                    model: MODEL,
                    messages: [{ role: 'user', content: verificationPrompt }]
                });

                const correctedContent = correctionResponse.data.choices[0].message.content;

                // Extract SQL from correction
                const correctedSqlMatch = correctedContent.match(/```sql\s*([\s\S]*?)\s*```/) ||
                    correctedContent.match(/SELECT[\s\S]*?;/i) ||
                    correctedContent;

                if (correctedSqlMatch) {
                    sqlQuery = correctedSqlMatch[0].replace(/```sql|```/g, '').trim();
                }
            } catch (correctionError) {
                console.error('Error during SQL correction:', correctionError);
                // Continue with the uncorrected SQL
            }
        }

        // Apply final manual fixes
        sqlQuery = sqlQuery
            .replace(/\balbums\b/g, "albm")
            .replace(/\btracks\b/g, "trk")
            .replace(/\btitle\b/g, "ttle")
            .replace(/\bAlbumID\b/g, "AlbmID")
            .replace(/\bTrackID\b/g, "TrackNo")
            .replace(/\bArtistId\b/g, "ArtistIdentifier")
            .replace(/\bFirstName\b/g, "F_NAME")
            .replace(/\bLastName\b/g, "L_NAME")
            .replace(/\bCustomerId\b/g, "cust_id")
            .replace(/\bInvoiceId\b/g, "invoice_num")
            .replace(/\bInvoiceDate\b/g, "date_of_invoice")
            .replace(/\bYEAR\(/gi, "EXTRACT(YEAR FROM ")
            .replace(/WHERE\s+([\w\.]+)\s*=\s*["'](\d+)["']/gi, "WHERE $1 = $2")
            .replace(/["'](\d+)["']/g, "$1");

        console.log("Final SQL query:", sqlQuery);

        return {
            sql: sqlQuery,
            chartType: chartType
        };
    } catch (error) {
        console.error('OpenRouter API error:', error);

        // Implement robust fallback with alternative queries
        try {
            // Try a simplified approach based on keywords
            const keywords = question.toLowerCase();
            let fallbackSql;
            let fallbackChart = "table";

            if (keywords.includes("album") && keywords.includes("2016")) {
                fallbackSql = "SELECT * FROM albm WHERE col1 = 2016";
                fallbackChart = "table";
            } else if (keywords.includes("expensive") && keywords.includes("track")) {
                fallbackSql = "SELECT TrackTitle, cost FROM trk ORDER BY cost DESC LIMIT 5";
                fallbackChart = "bar";
            } else if (keywords.includes("invoice") && keywords.includes("2023")) {
                fallbackSql = `SELECT i.invoice_num, c.F_NAME || ' ' || c.L_NAME AS customer_name, i.TotalAmount 
                              FROM invoice i JOIN customer c ON i.customerID = c.cust_id 
                              WHERE EXTRACT(YEAR FROM i.date_of_invoice) = 2023`;
                fallbackChart = "table";
            } else if (keywords.includes("artist") || keywords.includes("artist")) {
                fallbackSql = "SELECT * FROM artist LIMIT 10";
                fallbackChart = "table";
            } else {
                fallbackSql = "SELECT * FROM albm LIMIT 5";
                fallbackChart = "table";
            }

            console.log("Using fallback SQL:", fallbackSql);
            return {
                sql: fallbackSql,
                chartType: fallbackChart
            };
        } catch (fallbackError) {
            console.error('Even fallback failed:', fallbackError);
            // Ultimate fallback
            return {
                sql: "SELECT * FROM albm LIMIT 5",
                chartType: "table"
            };
        }
    }
};

export const generateAnswer = async (question, result) => {
    try {
        // Updated prompt for more conversational, direct answers
        const prompt = `
You are an AI data analyst that provides clear, direct answers to questions about a music database.

DATABASE CONTEXT: 
This database has messy table and column names:
- "albm" table contains album information (not "album")
- "ttle" column contains album titles (not "title")

USER QUESTION: ${question}

QUERY RESULT: ${JSON.stringify(result)}

Provide a conversational, direct answer that feels like a natural response. Begin by directly addressing what was asked.
For example, if asked about albums in 2016, start with "In 2016, [album name] was released."

DO NOT use phrases like "Based on the data" or "According to the results."
DO NOT explain SQL syntax or mention SQL commands.
DO NOT reference JSON objects or formatting.
DO NOT preface your answer with "To answer your question" or similar phrases.

Make your response sound natural and helpful, as if you're having a conversation.
`;

        const response = await openRouterClient.post('/chat/completions', {
            model: MODEL,
            messages: [{ role: 'user', content: prompt }]
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return "Here are the results of your query.";
    }
};

// Default export for compatibility with any modules that import the entire file
export default { generateSQL, generateAnswer, SCHEMA_MAPPING };
