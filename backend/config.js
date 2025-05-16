export default {
    // Server configuration
    server: {
        port: process.env.PORT || 8000,
        environment: process.env.NODE_ENV || 'development',
    },

    // AI configuration for language models
    ai: {
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
        ollamaModel: process.env.OLLAMA_MODEL || "llama2"
    },

    // Data agent configuration
    dataAgent: {
        // Add data agent specific config here
        // For example:
        maxResultsPerQuery: parseInt(process.env.MAX_RESULTS_PER_QUERY || '100'),
        cacheEnabled: process.env.CACHE_ENABLED === 'true' || false,
    },

    // Database configuration
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'chinook',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    },
}