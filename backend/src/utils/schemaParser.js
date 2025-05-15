// Utility to parse and describe DB schema for LLM prompts

/**
 * Parses the database schema and returns a description.
 * @param {Object} schema - The database schema object.
 * @returns {string} - A description of the schema for LLM prompts.
 */
function parseSchema(schema) {
    if (!schema || typeof schema !== 'object') {
        throw new Error('Invalid schema object');
    }

    let description = 'Database Schema Description:\n';

    for (const [tableName, tableDetails] of Object.entries(schema)) {
        description += `Table: ${tableName}\n`;

        if (tableDetails.columns) {
            description += 'Columns:\n';
            for (const [columnName, columnDetails] of Object.entries(tableDetails.columns)) {
                description += `  - ${columnName}: ${columnDetails.type}\n`;
            }
        }

        if (tableDetails.relationships) {
            description += 'Relationships:\n';
            for (const relationship of tableDetails.relationships) {
                description += `  - ${relationship.type} with ${relationship.targetTable}\n`;
            }
        }

        description += '\n';
    }

    return description.trim();
}

module.exports = {
    parseSchema,
};