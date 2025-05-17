import * as db from '../db/database.js';

// Function to build complete schema context dynamically
export const buildFullSchemaContext = async () => {
    try {
        // Get all tables
        const tables = await db.getActualTableNames();

        // Build schema details for each table
        const tableDetails = await Promise.all(tables.map(async (tableName) => {
            const columns = await db.getTableColumns(tableName);
            return `- "${tableName}" table with columns: ${columns.map(col => `"${col}"`).join(', ')}`;
        }));

        // Get foreign key relationships
        const relationships = await db.executeInternalQuery(`
      SELECT
        tc.table_name AS table_name,
        kcu.column_name AS column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

        // Format relationship information
        const relationshipInfo = relationships.map(rel =>
            `- ${rel.table_name}.${rel.column_name} references ${rel.foreign_table_name}.${rel.foreign_column_name}`
        ).join('\n');

        // Combine everything into a comprehensive schema context
        return `
    IMPORTANT: The database has the following tables:
    ${tableDetails.join('\n')}
    
    Foreign key relationships:
    ${relationshipInfo}
    
    ALWAYS use the exact table and column names as shown above.
    Do not abbreviate table or column names.
    `;
    } catch (error) {
        console.error('Error building schema context:', error);
        return 'Error fetching schema information. Please use standard SQL patterns.';
    }
};