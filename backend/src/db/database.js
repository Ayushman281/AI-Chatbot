// database.js for PostgreSQL with Chinook database

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false  // Required for Render PostgreSQL
    }
});

export default pool;

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to PostgreSQL database:', process.env.DB_NAME);
    }
});

// Add this function - use for internal system queries only
export const executeInternalQuery = async (sql, params = []) => {
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (err) {
        console.error('Internal query error:', err.message);
        throw err;
    }
};

// Add this new function to get actual table names
export const getActualTableNames = async () => {
    try {
        // Use executeInternalQuery to avoid recursion
        const tables = await executeInternalQuery(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        return tables.map(t => t.table_name);
    } catch (err) {
        console.error('Error fetching table names:', err.message);
        throw err;
    }
};

// Also add this function to get actual column names for a table
export const getTableColumns = async (tableName) => {
    try {
        const columns = await executeInternalQuery(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = $1
        `, [tableName]);

        return columns.map(c => c.column_name);
    } catch (err) {
        console.error(`Error fetching columns for ${tableName}:`, err.message);
        throw err;
    }
};

// Update the verifyTableAndColumnExistence function to use internal query
export const verifyTableAndColumnExistence = async (sql) => {
    try {
        // Extract table names from SQL (basic regex approach)
        const tableRegex = /\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/gi;
        const matches = [...sql.matchAll(tableRegex)];
        const tableNames = matches.map(match => match[1].toLowerCase());

        if (tableNames.length === 0) {
            return true; // No tables to verify
        }

        // Get actual table names from database USING INTERNAL QUERY
        const tables = await executeInternalQuery(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        const actualTables = tables.map(t => t.table_name.toLowerCase());

        // Check if all referenced tables exist
        const missingTables = tableNames.filter(t => !actualTables.includes(t));

        if (missingTables.length > 0) {
            throw new Error(`Tables do not exist: ${missingTables.join(', ')}`);
        }

        return true;
    } catch (err) {
        console.error('Table verification error:', err.message);
        throw err;
    }
};

// Keep your regular query function the same, it will use verifyTableAndColumnExistence
export const query = async (sql, params = []) => {
    try {
        // Verify tables exist
        await verifyTableAndColumnExistence(sql);

        // Then execute the query
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (err) {
        console.error('Query error:', err.message);
        console.error('Failed query:', sql);
        throw err;
    }
};

export const schemaInfo = {
    description: `
The Chinook database represents a digital media store with a DELIBERATELY MESSY schema:
- Artist (table "artist"): Contains artist information with columns ArtistIdentifier (ID) and NM (name)
- Album (table "albm"): Contains album data with columns AlbumId, ttle (title), a_id (artist ID), and col1 (release year)
- Track (table "trk"): Contains track info with columns TrackNo, TrackTitle, AlbmID, MediaTypeIdentifier, GenreID, cost
- MediaType (table "media_type"): Contains media type descriptions
- Genre (table "genre"): Contains genre classifications with columns id and genre_type
- Invoice (table "invoice"): Contains sales invoice data
- InvoiceLine (table "inv_line"): Contains invoice line items
`
};

process.on('SIGINT', () => {
    pool.end();
    process.exit(0);
});