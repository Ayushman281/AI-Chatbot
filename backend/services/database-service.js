import { Sequelize } from 'sequelize';
import logger from '../utils/logger.js';
import config from '../config/index.js';

class DatabaseService {
    constructor() {
        this.sequelize = new Sequelize(
            config.database.name,
            config.database.user,
            config.database.password,
            {
                host: config.database.host,
                port: config.database.port,
                dialect: 'postgres',
                logging: msg => logger.debug(msg),
                dialectOptions: {
                    ssl: config.database.ssl ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                }
            }
        );

        this.isConnected = false;
    }

    async connect() {
        try {
            await this.sequelize.authenticate();
            this.isConnected = true;
            logger.info('Database connection established successfully');
            return true;
        } catch (error) {
            logger.error('Unable to connect to the database:', error);
            this.isConnected = false;
            throw error;
        }
    }

    async getSchemaInfo() {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            // Get all tables
            const [tables] = await this.sequelize.query(`
        SELECT 
          table_schema,
          table_name
        FROM 
          information_schema.tables
        WHERE 
          table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_type = 'BASE TABLE'
        ORDER BY
          table_schema, table_name
      `);

            // Get all columns for each table
            const schemaInfo = {};
            for (const table of tables) {
                const schema = table.table_schema;
                const tableName = table.table_name;

                if (!schemaInfo[schema]) {
                    schemaInfo[schema] = {};
                }

                const [columns] = await this.sequelize.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM 
            information_schema.columns
          WHERE 
            table_schema = '${schema}'
            AND table_name = '${tableName}'
          ORDER BY
            ordinal_position
        `);

                schemaInfo[schema][tableName] = columns;
            }

            // Get foreign keys
            const [foreignKeys] = await this.sequelize.query(`
        SELECT
          tc.table_schema, 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);

            // Add foreign key information to schema info
            for (const fk of foreignKeys) {
                const schema = fk.table_schema;
                const tableName = fk.table_name;
                const columnName = fk.column_name;

                // Find the column in our schema info
                const column = schemaInfo[schema][tableName].find(col => col.column_name === columnName);
                if (column) {
                    column.foreignKey = {
                        schema: fk.foreign_table_schema,
                        tableName: fk.foreign_table_name,
                        columnName: fk.foreign_column_name
                    };
                }
            }

            return schemaInfo;
        } catch (error) {
            logger.error('Error fetching schema information:', error);
            throw error;
        }
    }

    async getDetailedSchemaInfo() {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const basicSchemaInfo = await this.getSchemaInfo();

            // Get sample data for each table to understand content
            const detailedSchema = { ...basicSchemaInfo };

            for (const schema in detailedSchema) {
                for (const tableName in detailedSchema[schema]) {
                    // Get row count
                    const [rowCountResult] = await this.sequelize.query(`
            SELECT COUNT(*) AS count FROM "${schema}"."${tableName}"
          `);
                    const rowCount = parseInt(rowCountResult[0].count, 10);

                    // Get sample data (up to 5 rows)
                    const [sampleData] = await this.sequelize.query(`
            SELECT * FROM "${schema}"."${tableName}" LIMIT 5
          `);

                    // Add info to schema
                    detailedSchema[schema][tableName] = {
                        columns: detailedSchema[schema][tableName],
                        rowCount,
                        sampleData,
                        possibleMisspellings: this.detectPossibleMisspellings(schema, tableName, detailedSchema[schema][tableName])
                    };
                }
            }

            // Add the views to help with the messy schema
            const [views] = await this.sequelize.query(`
        SELECT 
          table_schema,
          table_name,
          view_definition
        FROM 
          information_schema.views
        WHERE 
          table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY
          table_schema, table_name
      `);

            detailedSchema.views = views;

            return detailedSchema;
        } catch (error) {
            logger.error('Error fetching detailed schema information:', error);
            throw error;
        }
    }

    detectPossibleMisspellings(schema, tableName, columns) {
        // Common column name patterns to recognize
        const columnPatterns = {
            id: /^.*id$/i,
            name: /^n[a-z]{0,2}m[a-z]{0,1}$/i, // Catches name, nm, nme etc.
            title: /^t[a-z]{0,2}t[a-z]{0,2}l[a-z]{0,1}$/i, // Catches title, ttl, etc.
            price: /^pr[a-z]{0,3}c[a-z]{0,1}$/i, // price, prc, etc.
            date: /^.*date$/i,
            description: /^desc.*$/i,
            quantity: /^qt[a-z]*$/i,
            address: /^addr.*$/i,
            email: /^e*mail.*$/i,
            phone: /^ph[a-z]*$/i,
            col1: /^col\d+$/i // Generic column names
        };

        const misspellings = {};

        // Check each column
        columns.forEach(column => {
            const colName = column.column_name.toLowerCase();

            // Check against patterns
            for (const [standardName, pattern] of Object.entries(columnPatterns)) {
                if (pattern.test(colName) && colName !== standardName) {
                    misspellings[colName] = standardName;
                    break;
                }
            }
        });

        return misspellings;
    }

    async executeQuery(query, params = []) {
        if (!this.isConnected) {
            await this.connect();
        }

        try {
            const [results] = await this.sequelize.query(query, {
                replacements: params,
                type: this.sequelize.QueryTypes.SELECT
            });

            return results;
        } catch (error) {
            logger.error(`Error executing query: ${query}`, error);
            throw error;
        }
    }

    async close() {
        if (this.isConnected) {
            try {
                await this.sequelize.close();
                this.isConnected = false;
                logger.info('Database connection closed');
            } catch (error) {
                logger.error('Error closing database connection:', error);
                throw error;
            }
        }
    }
}

// Changed from CommonJS export to ES module export
const databaseService = new DatabaseService();
export default databaseService;