import * as db from '../src/db/database.js';

async function validateDatabase() {
    try {
        console.log("Connecting to database...");

        // Test tables exist
        const tables = await db.executeInternalQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        console.log("\nDatabase Tables:");
        for (const table of tables) {
            console.log(`- ${table.table_name}`);
        }

        // Check for critical tables
        const criticalTables = ['albm', 'trk', 'artist'];
        for (const table of criticalTables) {
            const tableExists = tables.some(t => t.table_name === table);
            if (!tableExists) {
                console.error(`\n⚠️ CRITICAL TABLE MISSING: "${table}"`);
            }
        }

        // Count rows in each table
        console.log("\nRow Counts:");
        for (const table of tables) {
            const count = await db.executeInternalQuery(`
                SELECT COUNT(*) FROM "${table.table_name}"
            `);
            console.log(`- ${table.table_name}: ${count[0].count} rows`);
        }

        process.exit(0);
    } catch (error) {
        console.error("Error validating database:", error);
        process.exit(1);
    }
}

validateDatabase();