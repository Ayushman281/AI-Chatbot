export default {
    // Server configuration
    server: {
        port: process.env.PORT || 8000,
        environment: process.env.NODE_ENV || 'development',
    },

    // AI configuration for language models
    ai: {
        // OpenRouter settings
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        openRouterModel: process.env.OPENROUTER_MODEL || "tngtech/deepseek-r1t-chimera:free",
        huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
    },

    // Data agent configuration
    dataAgent: {
        // Add data agent specific config here
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