// database.js for PostgreSQL with Chinook database

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

// Create database connection configuration
let poolConfig;

// Check if DATABASE_URL is provided (for production/deployed environment)
if (process.env.DATABASE_URL) {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false // Only for production environments
        } : false
    };
    console.log('Using DATABASE_URL for connection');
}
// Otherwise, use individual DB parameters (for local development)
else {
    poolConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true'
    };
    console.log('Using individual DB parameters for connection');
}

// Create the connection pool with the determined configuration
const pool = new Pool(poolConfig);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to PostgreSQL database');
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

// Update your query function to always return a properly structured result
export const query = async (text, params = []) => {
    try {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res; // This should have a 'rows' property
    } catch (error) {
        console.error('Error executing query:', error.message);
        // Return empty result instead of throwing
        return { rows: [], rowCount: 0 };
    }
};

// Export the pool for use in other files
export default pool;

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