import { Ollama } from 'ollama';

// Initialize Ollama client
const ollama = new Ollama({
    host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

// The model to use
const MODEL = process.env.OLLAMA_MODEL || 'llama2';

// Schema mapping to handle messy database
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
    }
};

// Build detailed schema information string
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

export const generateSQL = async (question, schemaInfo) => {
    try {
        const prompt = `
You are an expert SQL query generator working with a DELIBERATELY MESSY database schema.

${buildSchemaDescription()}

USER QUESTION: ${question}

Your task is to generate a valid SQL query that correctly answers the user's question.

EXAMPLES OF CORRECT SQL:
1. To find album titles: SELECT "ttle" FROM "albm"
2. To find albums from 2016: SELECT "AlbumId", "ttle" FROM "albm" WHERE "col1" = 2016
3. To join albums and tracks: SELECT albm.ttle, trk.TrackTitle FROM albm JOIN trk ON trk.AlbmID = albm.AlbumId

IMPORTANT: Return ONLY a JSON object with this exact format:
{
  "sql": "YOUR SQL QUERY HERE",
  "chartType": "CHART_TYPE_HERE"
}

// Enhance the prompt for chart type recommendations
For chartType, select the most appropriate visualization:
- Use "bar" for comparing values across categories or time periods
- Use "line" for time series data or trends over time
- Use "pie" for showing proportions or percentages
- Use "table" for detailed data that doesn't fit the above categories

For year-based queries, always include "bar" as the chart type.
DO NOT include any explanations, markdown formatting, code blocks, or additional text.
ENSURE you use the correct messy column names like "ttle" (with TWO t's) for album title.
`;

        const response = await ollama.chat({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
        });

        // Try to extract JSON from the response
        try {
            const content = response.message.content;
            console.log("Raw Ollama response:", content.substring(0, 200) + "...");

            // Attempt different extraction methods
            let jsonData;

            // Method 1: Direct JSON parse if the response is clean JSON
            try {
                jsonData = JSON.parse(content);
                console.log("Parsed using direct JSON parse");
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
                    } catch (e2) {
                        throw new Error("Failed to parse extracted JSON: " + e2.message);
                    }
                } else {
                    // Method 3: Try to rebuild JSON from SQL
                    const sqlMatch = content.match(/```sql\s*([\s\S]*?)\s*```/) ||
                        content.match(/SELECT[\s\S]*?;/i);

                    if (sqlMatch) {
                        const sqlQuery = sqlMatch[0].replace(/```sql|```/g, '').trim();
                        jsonData = {
                            sql: sqlQuery,
                            chartType: "table"
                        };
                        console.log("Rebuilt JSON from SQL extraction");
                    } else {
                        throw new Error("Could not extract SQL or JSON from response");
                    }
                }
            }

            // Validate and fix SQL regardless of how we got it
            if (jsonData.sql) {
                jsonData.sql = jsonData.sql
                    .replace(/\btle\b/g, "ttle")
                    .replace(/\balm\b/g, "albm")
                    .replace(/\btrack\b/g, "trk")
                    // Fix numeric values in WHERE clauses - remove quotes around numbers
                    .replace(/WHERE\s+([\w\.]+)\s*=\s*["'](\d+)["']/gi, "WHERE $1 = $2")
                    .replace(/["'](\d+)["']/g, "$1"); // Remove quotes around numeric values elsewhere

                console.log("Final SQL query:", jsonData.sql);
                return jsonData;
            } else {
                throw new Error("No SQL found in parsed response");
            }
        } catch (parseError) {
            console.error('Failed to parse Ollama response:', parseError);
            console.log('Full raw Ollama response:', response.message.content);

            // Last resort fallback
            return {
                sql: "SELECT * FROM albm LIMIT 10;",
                chartType: "table"
            };
        }
    } catch (error) {
        console.error('Ollama API error:', error);
        throw new Error('Failed to generate SQL query');
    }
};

export const generateAnswer = async (question, result) => {
    try {
        const prompt = `
You are an AI assistant that explains database query results directly and concisely.

DATABASE CONTEXT: 
This database has messy table and column names:
- "albm" table contains album information (not "album")
- "ttle" column contains album titles (not "title")

USER QUESTION: ${question}

QUERY RESULT: ${JSON.stringify(result)}

Provide a direct, concise answer that directly addresses the question. 
DO NOT include phrases like "Direct answer to the user's question" or "The answer is".
DO NOT explain SQL syntax or mention SQL commands in your response.
DO NOT reference JSON objects or formatting.

FORMAT YOUR RESPONSE LIKE THIS:
First sentence: Direct factual answer (just the facts)
Second sentence: Brief insight about the data (optional, only if relevant)

EXAMPLE GOOD RESPONSE:
"1 album was released in 2016. This album is titled 'Lemonade'."

EXAMPLE BAD RESPONSE (DO NOT DO THIS):
"Direct answer to the user's question: 1 album was released in 2016.
Brief insight about the data: The database only contains information on one album released in 2016."

OR THIS (DO NOT DO THIS):
"Based on the SQL query to the albm table where col1=2016, I can see that..."
`;

        const response = await ollama.chat({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.message.content;
    } catch (error) {
        console.error('Ollama API error:', error);
        return "Here are the results of your query.";
    }
};

// Default export for compatibility with any modules that import the entire file
export default { generateSQL, generateAnswer, SCHEMA_MAPPING };
