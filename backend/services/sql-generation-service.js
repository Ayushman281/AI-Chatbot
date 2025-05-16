import { LangChain } from 'langchain';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';
import databaseService from './database-service.js';

class SQLGenerationService {
    constructor() {
        this.model = new OpenAI({
            temperature: 0,
            modelName: 'gpt-4', // Or appropriate model
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateSQL(question, nlpAnalysis, conversationContext = []) {
        try {
            console.log(`Generating SQL for question: "${question}"`);

            // Get detailed schema information
            const schemaDetails = await databaseService.getDetailedSchemaInfo();

            // Create a prompt for SQL generation
            const prompt = this.createSQLGenerationPrompt(question, schemaDetails, nlpAnalysis, conversationContext);

            // Generate SQL using the LLM
            const result = await this.model.call(prompt);

            // Extract the SQL query from the result
            const sqlQuery = this.extractSQLFromResult(result);

            // Validate the SQL (basic syntax check)
            this.validateSQL(sqlQuery);

            return {
                sqlQuery,
                explanation: this.generateExplanation(sqlQuery),
                tables: this.extractTablesFromSQL(sqlQuery)
            };
        } catch (error) {
            console.error('Error generating SQL query:', error);
            throw new Error('Failed to generate SQL query for your question');
        }
    }

    createSQLGenerationPrompt(question, schemaDetails, nlpAnalysis, conversationContext) {
        // Template for SQL generation prompt
        const template = `
    You are an expert SQL developer working with a messy database that has poorly named tables and columns.
    
    DATABASE SCHEMA:
    ${JSON.stringify(schemaDetails, null, 2)}
    
    PREVIOUS CONVERSATION:
    ${this.formatConversationContext(conversationContext)}
    
    USER QUESTION: "${question}"
    
    ANALYSIS:
    ${JSON.stringify(nlpAnalysis, null, 2)}
    
    Your task is to write a PostgreSQL query that correctly answers the user's question.
    
    Rules:
    1. Use only the tables and columns that exist in the schema
    2. Handle messy data and poorly named tables/columns appropriately
    3. Use aliases to make the results more readable
    4. Include appropriate JOINs and WHERE clauses
    5. Order and group results as appropriate for the question
    6. Limit results to a reasonable number if returning many rows
    
    Return ONLY the SQL query without any explanation or markdown formatting.
    `;

        return template;
    }

    formatConversationContext(conversationContext) {
        if (!conversationContext || conversationContext.length === 0) {
            return 'No previous conversation';
        }

        return conversationContext
            .map((exchange, index) => {
                return `Exchange ${index + 1}:
User: ${exchange.question}
Generated SQL: ${exchange.sqlQuery}`;
            })
            .join('\n\n');
    }

    extractSQLFromResult(result) {
        // Clean up the result to extract just the SQL query
        // Remove any markdown code block indicators
        let sql = result.replace(/```sql\n|```\n|```/g, '').trim();

        return sql;
    }

    validateSQL(sqlQuery) {
        // Basic validation - in a real system, you'd want more robust validation
        if (!sqlQuery.toLowerCase().includes('select')) {
            throw new Error('Invalid SQL query: Missing SELECT statement');
        }

        // Additional validation could be performed here
        return true;
    }

    generateExplanation(sqlQuery) {
        // In a real implementation, this would use an LLM to generate an explanation
        // For now, providing a placeholder
        return `This SQL query retrieves the requested information by selecting appropriate columns, joining necessary tables, and filtering the data based on the criteria in your question.`;
    }

    extractTablesFromSQL(sqlQuery) {
        // Simple regex to extract table names from SQL
        // This is a basic implementation and would need to be more robust in production
        const fromRegex = /from\s+([a-zA-Z0-9_\.]+)/i;
        const joinRegex = /join\s+([a-zA-Z0-9_\.]+)/gi;

        const tables = [];

        // Extract table after FROM
        const fromMatch = sqlQuery.match(fromRegex);
        if (fromMatch && fromMatch[1]) {
            tables.push(fromMatch[1]);
        }

        // Extract tables after JOIN
        let joinMatch;
        while ((joinMatch = joinRegex.exec(sqlQuery)) !== null) {
            if (joinMatch[1]) {
                tables.push(joinMatch[1]);
            }
        }

        return [...new Set(tables)]; // Remove duplicates
    }
}

export default new SQLGenerationService();
