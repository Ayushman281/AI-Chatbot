import { LangChain } from 'langchain';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';
import databaseService from './database-service.js';

class NLPService {
    constructor() {
        this.model = new OpenAI({
            temperature: 0,
            modelName: 'gpt-4', // Or appropriate model
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async processQuery(question, conversationContext = []) {
        try {
            console.log(`Processing question: "${question}"`);

            // Get database schema information
            const schemaInfo = await databaseService.getSchemaInfo();

            // Create a prompt that includes schema information and conversation history
            const prompt = this.createPromptWithSchema(question, schemaInfo, conversationContext);

            // Use LLM to analyze the question
            const analysis = await this.analyzeQuestion(prompt);

            return {
                intent: analysis.intent,
                entities: analysis.entities,
                sqlQuery: analysis.sqlQuery,
                requiredVisualization: analysis.visualization,
                confidence: analysis.confidence
            };
        } catch (error) {
            console.error('Error processing natural language query:', error);
            throw new Error('Failed to process your question. Please try rephrasing it.');
        }
    }

    createPromptWithSchema(question, schemaInfo, conversationContext) {
        // Template for the prompt including schema information and conversation history
        const template = `
    You are an expert SQL analyst working with a messy database that has the following schema:
    
    ${JSON.stringify(schemaInfo, null, 2)}
    
    Previous conversation:
    ${this.formatConversationContext(conversationContext)}
    
    User's question: "${question}"
    
    Analyze the user's question and provide:
    1. The primary intent of the question
    2. Key entities mentioned in the question
    3. The most appropriate SQL query to answer this question
    4. The best visualization type for the results (table, bar chart, line chart, pie chart, etc.)
    5. A confidence score (0-1) for your SQL query
    
    Format your response as a JSON object with keys: intent, entities, sqlQuery, visualization, confidence
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
System: ${exchange.answer}`;
            })
            .join('\n\n');
    }

    async analyzeQuestion(prompt) {
        const response = await this.model.call(prompt);

        try {
            // Parse the JSON response from the LLM
            return JSON.parse(response);
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            throw new Error('Failed to analyze your question properly');
        }
    }
}

export default new NLPService();
