const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., 'localhost'
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false, // set to true if using Azure
        trustServerCertificate: true // for local dev/testing
    }
};

exports.query = async (queryString) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(queryString);
        return result.recordset;
    } catch (err) {
        throw err;
    }
};

// Dummy schema info for LLM prompt (replace with actual AdventureWorks schema if needed)
exports.schemaInfo = "AdventureWorks sample schema loaded from SQL Server.";
