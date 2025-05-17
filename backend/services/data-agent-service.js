import axios from 'axios';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import databaseService from './database-service.js';
import logger from '../utils/logger.js';
import config from '../config.js';

// OpenRouter LLM Class implementation - using axios directly
class OpenRouterLLM {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.OPENROUTER_API_KEY || "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";
        this.model = options.model || process.env.OPENROUTER_MODEL || "tngtech/deepseek-r1t-chimera:free";
        this.temperature = options.temperature ?? 0;
        this.client = axios.create({
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async call(prompt) {
        try {
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: this.temperature
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error("OpenRouter API error:", error);
            throw new Error(`OpenRouter API call failed: ${error.message}`);
        }
    }

    // For compatibility with LangChain
    async invoke(input) {
        try {
            const messages = Array.isArray(input) ? input : [{ role: 'user', content: input }];
            const response = await this.client.post('/chat/completions', {
                model: this.model,
                messages: messages,
                temperature: this.temperature
            });
            return {
                content: response.data.choices[0].message.content
            };
        } catch (error) {
            console.error("OpenRouter API error:", error);
            throw new Error(`OpenRouter API call failed: ${error.message}`);
        }
    }
}

class DataAgent {
    constructor() {
        // Replace ChatOllama with OpenRouterLLM
        this.llm = new OpenRouterLLM({
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL || "deepseek-ai/deepseek-r1t-chimera",
            temperature: 0
        });

        this.embeddings = new HuggingFaceInferenceEmbeddings({
            apiKey: config.ai.huggingfaceApiKey,
            model: "sentence-transformers/all-mpnet-base-v2"
        });

        this.schemaMapping = null;
        this.schemaIndex = null;
        this.initialized = false;

        // Add schema mapping for messy database (keep this unchanged)
        this.messySchemaMapping = {
            tables: {
                "album": "albm",
                "track": "trk",
                "employee": "employe",
                "invoice_line": "inv_line"
            },
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
                }
            }
        };
    }

    async initialize() {
        try {
            await databaseService.connect();
            const schemaInfo = await databaseService.getDetailedSchemaInfo();

            // Create schema mapping for messy columns
            this.schemaMapping = this.buildSchemaMapping(schemaInfo);

            // Create schema index for improved schema understanding
            await this.createSchemaIndex(schemaInfo);

            this.initialized = true;
            logger.info('DataAgent initialized successfully');
        } catch (error) {
            logger.error('Error initializing DataAgent:', error);
            throw error;
        }
    }

    buildSchemaMapping(schemaInfo) {
        const mapping = {
            tables: this.messySchemaMapping.tables,
            columns: {},
            views: {}
        };

        // Process tables and their columns
        for (const schema in schemaInfo) {
            if (schema === 'views') continue;

            for (const tableName in schemaInfo[schema]) {
                const tableInfo = schemaInfo[schema][tableName];
                const normalizedTableName = tableName.toLowerCase();

                // Handle potentially misspelled table names
                if (!mapping.tables[normalizedTableName] &&
                    Object.values(mapping.tables).includes(normalizedTableName)) {
                    // This is already a mapped table name, no need to remap
                    continue;
                }

                // Add column mappings
                tableInfo.columns.forEach(column => {
                    const colName = column.column_name.toLowerCase();
                    const qualifiedColName = `${normalizedTableName}.${colName}`;

                    // Add mappings from messySchemaMapping
                    if (this.messySchemaMapping.columns[normalizedTableName] &&
                        this.messySchemaMapping.columns[normalizedTableName][colName]) {
                        mapping.columns[qualifiedColName] = {
                            table: tableName,
                            schema,
                            correctName: this.messySchemaMapping.columns[normalizedTableName][colName]
                        };
                    }
                });
            }
        }

        return mapping;
    }

    async createSchemaIndex(schemaInfo) {
        try {
            const documents = [];

            for (const schema in schemaInfo) {
                if (schema === 'views') continue;

                for (const tableName in schemaInfo[schema]) {
                    const tableInfo = schemaInfo[schema][tableName];

                    const tableDoc = new Document({
                        pageContent: `Table: ${schema}.${tableName}
    Description: ${this.inferTableDescription(tableName)}
    Row Count: ${tableInfo.rowCount}
    Columns: ${tableInfo.columns.map(c => c.column_name).join(', ')}
    Sample Data: ${JSON.stringify(tableInfo.sampleData).slice(0, 500)}...
    `,
                        metadata: {
                            type: 'table',
                            schema,
                            tableName
                        }
                    });
                    documents.push(tableDoc);

                    tableInfo.columns.forEach(column => {
                        const colDoc = new Document({
                            pageContent: `Column: ${schema}.${tableName}.${column.column_name}
    Data Type: ${column.data_type}
    Nullable: ${column.is_nullable}
    Description: ${this.inferColumnDescription(tableName, column.column_name)}
    ${column.foreignKey ? `Foreign Key to: ${column.foreignKey.schema}.${column.foreignKey.tableName}.${column.foreignKey.columnName}` : ''}
    `,
                            metadata: {
                                type: 'column',
                                schema,
                                tableName,
                                columnName: column.column_name
                            }
                        });
                        documents.push(colDoc);
                    });
                }
            }

            if (schemaInfo.views) {
                schemaInfo.views.forEach(view => {
                    const viewDoc = new Document({
                        pageContent: `View: ${view.table_schema}.${view.table_name}
    Definition: ${view.view_definition}
    `,
                        metadata: {
                            type: 'view',
                            schema: view.table_schema,
                            viewName: view.table_name
                        }
                    });
                    documents.push(viewDoc);
                });
            }

            this.schemaIndex = await MemoryVectorStore.fromDocuments(
                documents,
                this.embeddings
            );

            logger.info('Schema index created successfully');
        } catch (error) {
            logger.error('Error creating schema index:', error);
            throw new Error(`Failed to create schema index: ${error.message}`);
        }
    }

    async generateSQL(question, schemaContext, conversationContext = []) {
        try {
            logger.info(`Generating SQL for question: "${question}"`);

            const schemaDetails = await this.getRelevantSchemaDetails(schemaContext);

            const messySchemaDesc = this.getMessySchemaDescription();

            const sqlGenerationPrompt = new PromptTemplate({
                template: `
You are an expert SQL developer working with a PostgreSQL database that has a DELIBERATELY MESSY schema.

DATABASE SCHEMA:
- "albm" (album): AlbumId (PK), ttle (title), a_id (artist ID), col1 (release year)
- "trk" (track): TrackNo (PK), TrackTitle, AlbmID, GenreID, cost, rlse_yr (release year)
- "artist": ArtistIdentifier (PK), NM (name), ctry (country)
- "genre": id (PK), genre_type

IMPORTANT RULES:
1. ALWAYS use the exact table and column names from the schema above.
2. NEVER use standard names like "album" or "track" in SQL.
3. For release year in albums, ALWAYS use "col1" column in "albm" table.
4. For album titles, ALWAYS use "ttle" column.

EXAMPLES:
Q: What album was released in 2016?
A: SELECT ttle AS album_title FROM albm WHERE col1 = 2016;

Q: List all tracks that cost more than 1.00
A: SELECT TrackTitle FROM trk WHERE cost > 1.00;

Q: Which artists have albums released in 2016?
A: SELECT a.NM AS artist_name, b.ttle AS album_title FROM artist a JOIN albm b ON a.ArtistIdentifier = b.a_id WHERE b.col1 = 2016;

USER QUESTION: {question}

Return ONLY the SQL query, no explanation or markdown.
`,
                inputVariables: ['question', 'conversationHistory']
            });

            const sqlChain = RunnableSequence.from([
                {
                    question: (input) => input.question,
                    conversationHistory: (input) => input.conversationHistory
                },
                sqlGenerationPrompt,
                this.llm,
                (output) => ({ text: output.content })
            ]);

            const conversationHistoryText = conversationContext.map((exchange, i) =>
                `Exchange ${i + 1}:
User: ${exchange.question}
SQL: ${exchange.sql || 'No SQL generated'}`
            ).join('\n\n');

            const result = await sqlChain.invoke({
                question,
                conversationHistory: conversationHistoryText || 'No previous conversation'
            });

            let sqlQuery = result.text.trim()
                .replace(/```sql|```/g, '')
                .replace(/^-- .*$/gm, '')
                .trim();

            logger.info(`Generated SQL query: ${sqlQuery}`);
            return sqlQuery;
        } catch (error) {
            logger.error('Error generating SQL query:', error);
            throw new Error(`SQL generation failed: ${error.message}`);
        }
    }

    getMessySchemaDescription() {
        return `
DATABASE SCHEMA (IMPORTANT - THIS DATABASE HAS MESSY TABLE/COLUMN NAMES!):

Tables:
1. "albm" (NOT album): 
   - AlbumId (primary key)
   - ttle (album title)
   - a_id (references artist.ArtistIdentifier)
   - col1 (release year as integer)

2. "trk" (NOT track):
   - TrackNo (primary key)
   - TrackTitle
   - AlbmID (references albm.AlbumId)
   - MediaTypeIdentifier (references media_type.TypeID)
   - GenreID (references genre.id)
   - written_by (composer)
   - length_ms (duration in milliseconds)
   - size_bytes (file size)
   - cost (price)
   - rlse_yr (release year)

3. "artist":
   - ArtistIdentifier (primary key)
   - NM (artist name)
   - ctry (country)

4. "genre":
   - id (primary key)
   - genre_type (genre name)

5. "customer":
   - cust_id (primary key)
   - F_NAME (first name)
   - L_NAME (last name)
   - SupportRepresentativeID (references employe.EmpID)

6. "invoice":
   - invoice_num (primary key)
   - customerID (references customer.cust_id)
   - date_of_invoice (purchase date)
   - TotalAmount (total price)

7. "inv_line" (NOT invoice_line):
   - ID (primary key)
   - inv_id (references invoice.invoice_num)
   - TrackIdentifier (references trk.TrackNo)
   - price
   - qty (quantity)
`;
    }

    async generateResponse(question, sql, results, conversationContext = []) {
        try {
            const responsePrompt = new PromptTemplate({
                template: `
You are a helpful data analyst explaining query results in a natural, conversational way.

IMPORTANT: The database uses messy table and column names:
- "albm" means "album"
- "trk" means "track" 
- "ttle" means "title"
- "NM" means "name"
- "col1" in albm table means "release year"

USER QUESTION: {question}

SQL QUERY USED:
{sql}

QUERY RESULTS (showing {resultCount} rows):
{results}

Respond in a natural, conversational manner. Start by directly answering the user's question.
For example, if asked about albums in 2016, begin with "In 2016, [album name] was released."

Translate messy database terms to proper English (e.g., say "albums" not "albms").
Highlight key insights from the data.
Mention any limitations (e.g., "only showing top 10 results").

DO NOT use phrases like "Based on the data" or "According to the results."
DO NOT explain SQL syntax or mention SQL commands.
DO NOT reference JSON objects or formatting.
DO NOT preface your answer with "To answer your question" or similar phrases.

Make your response sound natural and helpful, as if you're having a conversation.
`,
                inputVariables: ['question', 'sql', 'results', 'resultCount']
            });

            const responseChain = RunnableSequence.from([
                {
                    question: (input) => input.question,
                    sql: (input) => input.sql,
                    results: (input) => input.results,
                    resultCount: (input) => input.resultCount || 0
                },
                responsePrompt,
                this.llm,
                (output) => output.content
            ]);

            const formattedResults = Array.isArray(results)
                ? JSON.stringify(results.slice(0, 10), null, 2)  // top 10 only
                : String(results);

            const result = await responseChain.invoke({
                question,
                sql,
                results: formattedResults,
                resultCount: Array.isArray(results) ? results.length : 1
            });

            return result.trim();
        } catch (error) {
            logger.error('Error generating natural language response:', error);
            throw new Error(`Response generation failed: ${error.message}`);
        }
    }
}
const dataAgent = new DataAgent();
export default dataAgent;
