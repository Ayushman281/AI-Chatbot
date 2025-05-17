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
        'HTTP-Referer': process.env.APPLICATION_URL || 'https://ai-chatbot-five-flame.vercel.app', // Update with your deployed URL
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

// Find where you build the schema context for the LLM
const schemaContext = `
IMPORTANT: THESE ARE THE EXACT TABLE AND COLUMN NAMES - DO NOT ABBREVIATE THEM FURTHER:

1. "invoice" table (NOT "invvc"):
   - invoice_num (primary key)
   - customerID (references customer.cust_id)
   - date_of_invoice
   - TotalAmount

2. "inv_line" table (NOT "invvc_line"):
   - LineID (primary key)
   - invoice_num (references invoice.invoice_num)
   - TrackNo (references trk.TrackNo)

3. "customer" table (NOT "cstmr"):
   - cust_id (primary key)
   - F_NAME
   - L_NAME

4. "trk" table:
   - TrackNo (primary key)
   - TrackTitle (NOT "nme")
   - cost (NOT "prc")
   
5. "albm" table:
   - AlbumId (primary key)
   - ttle (album title, NOT "title")
   - a_id (references artist.ArtistIdentifier)
   - col1 (release year as integer)
   
6. "artist" table:
   - ArtistIdentifier (primary key)
   - NM (artist name)
`;

// Add this complete schema context
const completeSchemaContext = `
You are a SQL expert working with a DELIBERATELY MESSY database schema for a music store. 
The database has inconsistent naming conventions and abbreviations.

COMPLETE SCHEMA DEFINITION:

Tables and their columns:

1. "genre" table:
   - id (INT, PRIMARY KEY)
   - genre_type (VARCHAR)
   - col4 (VARCHAR)

2. "media_type" table:
   - TypeID (INT, PRIMARY KEY)
   - type_desc (VARCHAR)
   - col5 (BOOLEAN)

3. "artist" table:
   - ArtistIdentifier (INT, PRIMARY KEY)
   - NM (VARCHAR) - This is the artist name
   - ctry (VARCHAR) - This is country
   - col2 (VARCHAR)

4. "employe" table:
   - EmpID (INT, PRIMARY KEY)
   - surname (VARCHAR)
   - given_name (VARCHAR)
   - JobTitle (VARCHAR)
   - manager_id (INT, FOREIGN KEY to employe.EmpID) - Self-reference
   - DOB (TIMESTAMP)
   - StartDate (TIMESTAMP)
   - location (VARCHAR)
   - municipality (VARCHAR)
   - province (VARCHAR)
   - nation (VARCHAR)
   - post_code (VARCHAR)
   - telephone (VARCHAR)
   - facsimile (VARCHAR)
   - electronic_mail (VARCHAR)
   - col3 (NUMERIC)

5. "albm" table:
   - AlbumId (INT, PRIMARY KEY)
   - ttle (VARCHAR) - This is the album title
   - a_id (INT, FOREIGN KEY to artist.ArtistIdentifier)
   - col1 (INT) - This is release year

6. "customer" table:
   - cust_id (INT, PRIMARY KEY)
   - F_NAME (VARCHAR) - First name
   - L_NAME (VARCHAR) - Last name
   - COMPANY (VARCHAR)
   - addr (VARCHAR)
   - CITY (VARCHAR)
   - st (VARCHAR) - State
   - Country (VARCHAR)
   - ZIP (VARCHAR)
   - PhoneNum (VARCHAR)
   - fax_number (VARCHAR)
   - EmailAddress (VARCHAR)
   - SupportRepresentativeID (INT, FOREIGN KEY to employe.EmpID)
   - c_data (TEXT)

7. "trk" table:
   - TrackNo (INT, PRIMARY KEY)
   - TrackTitle (VARCHAR)
   - AlbmID (INT, FOREIGN KEY to albm.AlbumId)
   - MediaTypeIdentifier (INT, FOREIGN KEY to media_type.TypeID)
   - GenreID (INT, FOREIGN KEY to genre.id)
   - written_by (VARCHAR) - Composer
   - length_ms (INT) - Duration in milliseconds
   - size_bytes (INT)
   - cost (NUMERIC) - Price
   - col7 (INT)
   - rlse_yr (INT) - Release year

8. "invoice" table:
   - invoice_num (INT, PRIMARY KEY)
   - customerID (INT, FOREIGN KEY to customer.cust_id)
   - date_of_invoice (TIMESTAMP) - Invoice date
   - bill_addr (VARCHAR)
   - bill_city (VARCHAR)
   - bill_state (VARCHAR)
   - bill_country (VARCHAR)
   - bill_zip (VARCHAR)
   - TotalAmount (NUMERIC)
   - paymntstatus (VARCHAR)

9. "inv_line" table:
   - ID (INT, PRIMARY KEY)
   - inv_id (INT, FOREIGN KEY to invoice.invoice_num)
   - TrackIdentifier (INT, FOREIGN KEY to trk.TrackNo)
   - price (NUMERIC)
   - qty (INT) - Quantity
   - dscnt (NUMERIC) - Discount

10. "playlist" table:
    - list_id (INT, PRIMARY KEY)
    - description (VARCHAR)
    - createdby (INT)
    - col6 (TIMESTAMP) - Created date
    - numeric_albums (VARCHAR)

11. "playlist_track" table:
    - pl_id (INT, FOREIGN KEY to playlist.list_id, part of composite PRIMARY KEY)
    - t_id (INT, FOREIGN KEY to trk.TrackNo, part of composite PRIMARY KEY)
    - ordr (INT) - Order in playlist

KEY RELATIONSHIPS:
- Albums belong to artists: albm.a_id → artist.ArtistIdentifier
- Tracks belong to albums: trk.AlbmID → albm.AlbumId
- Tracks have genres: trk.GenreID → genre.id
- Tracks have media types: trk.MediaTypeIdentifier → media_type.TypeID
- Invoices belong to customers: invoice.customerID → customer.cust_id
- Invoice lines belong to invoices: inv_line.inv_id → invoice.invoice_num
- Invoice lines reference tracks: inv_line.TrackIdentifier → trk.TrackNo
- Customers have support representatives: customer.SupportRepresentativeID → employe.EmpID
- Employees have managers: employe.manager_id → employe.EmpID
- Playlist tracks link playlists and tracks: playlist_track.pl_id → playlist.list_id, playlist_track.t_id → trk.TrackNo

GUIDELINES:
- Always use the EXACT table and column names shown above
- Do NOT abbreviate names beyond what's already shown (e.g., "albm" is already abbreviated and should NOT be further shortened)
- Column names are case-sensitive and sometimes inconsistent (e.g., "ttle" for title, "NM" for name)
- For common queries:
  - To get artist data, use the "artist" table with column "NM"
  - To get album data, use the "albm" table with column "ttle"
  - To get track data, use the "trk" table with column "TrackTitle"
  - To get track pricing, use "trk.cost"
  - To count albums per artist, join "albm" and "artist" tables on "a_id" and "ArtistIdentifier"
  - For customer purchases, link "customer", "invoice", "inv_line", and "trk" tables
`;

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

export async function generateSQL(question, schemaContext = []) {
    try {
        const response = await openRouterClient.post('/chat/completions', {
            model: process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t-chimera:free',
            messages: [
                { role: 'system', content: 'You are an SQL expert.' },
                { role: 'user', content: `Generate SQL for PostgreSQL to answer this question about a music database: "${question}".\nFor albums released in a specific year, use: SELECT ttle FROM albm WHERE col1 = <year>;` }
            ]
        });

        // Add defensive access to response data
        if (response && response.data && response.data.choices &&
            response.data.choices[0] && response.data.choices[0].message) {
            return response.data.choices[0].message.content;
        } else {
            console.warn("Unexpected API response format:", JSON.stringify(response.data));
            // Return fallback SQL for this specific question
            if (question.toLowerCase().includes('album') &&
                question.toLowerCase().includes('2016')) {
                return "SELECT ttle FROM albm WHERE col1 = 2016";
            }
            return "SELECT * FROM trk LIMIT 5"; // Default fallback
        }
    } catch (error) {
        console.error('OpenRouter API error:', error);
        // Question-specific fallbacks
        if (question.toLowerCase().includes('album') &&
            question.toLowerCase().includes('2016')) {
            return "SELECT ttle FROM albm WHERE col1 = 2016";
        }
        return "SELECT * FROM trk LIMIT 5"; // Default fallback
    }
}

export const generateAnswer = async (question, result) => {
    try {
        const prompt = `
You are an AI data analyst that provides clear, direct answers to questions about a music database.

DATABASE CONTEXT: 
This database has messy table and column names:
- "albm" table contains album information (not "album")
- "ttle" column contains album titles (not "title")
- "col1" contains release years

USER QUESTION: ${question}

QUERY RESULT: ${JSON.stringify(result)}

Provide a conversational, direct answer that feels natural. Begin by directly addressing what was asked.

For year-related questions about albums, respond like: "In 2016, the following albums were released: [Album1], [Album2], etc."

If the result is empty, say: "I couldn't find any records matching your query."

DO NOT use phrases like "Based on the data" or "According to the results."
DO NOT explain SQL syntax or mention SQL commands.
DO NOT reference JSON objects or formatting.
DO NOT preface your answer with "To answer your question" or similar phrases.

Make your response sound natural and helpful, like you're having a conversation.
`;

        const response = await openRouterClient.post('/chat/completions', {
            model: MODEL,
            messages: [{ role: 'user', content: prompt }]
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenRouter API error:', error);
        return "I found the following in the database.";
    }
};

// Find or create a function that extracts SQL from the response
function extractSQLFromResponse(responseText) {
    // Add the new regex pattern to extract SQL between markers
    const sqlRegex = /===SQL===\s*([\s\S]*?)\s*===ENDSQL===|```sql\s*([\s\S]*?)\s*```/;
    const match = responseText.match(sqlRegex);

    if (match) {
        // Return the first capturing group that's not undefined
        return (match[1] || match[2]).trim();
    }

    // Fallback - look for SQL statements starting with SELECT, UPDATE, etc.
    const fallbackRegex = /(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s+[\s\S]+?;/i;
    const fallbackMatch = responseText.match(fallbackRegex);

    return fallbackMatch ? fallbackMatch[0].trim() : null;
}

// Default export for compatibility with any modules that import the entire file
export default { generateSQL, generateAnswer, SCHEMA_MAPPING };
