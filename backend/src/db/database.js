// database.js for PostgreSQL with Chinook database

import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// PostgreSQL connection configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    // For SSL, if needed (e.g. for production)
    // ssl: {
    //   rejectUnauthorized: false
    // }
};

// Create connection pool
const pool = new Pool(config);

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to PostgreSQL database:', process.env.DB_NAME);
    }
});

export const query = async (sql, params = []) => {
    try {
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