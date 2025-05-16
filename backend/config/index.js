import dotenv from 'dotenv';
dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),

    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'chinook',
        user: process.env.DB_USER || 'dataagent',
        password: process.env.DB_PASSWORD || 'password',
        ssl: process.env.DB_SSL === 'true'
    },

    ai: {
        openaiApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.AI_MODEL_NAME || 'gpt-4',
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0'),
        anthropicKey: process.env.ANTHROPIC_API_KEY,
        cohereKey: process.env.COHERE_API_KEY
    },

    session: {
        secret: process.env.SESSION_SECRET || 'ai-data-agent-secret',
        maxAge: parseInt(process.env.SESSION_MAX_AGE || (24 * 60 * 60 * 1000).toString(), 10) // Default 24h
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info'
    }
};

export default config;