exports.generateSQL = async (question, schemaInfo) => {
    // TODO: Integrate with OpenAI/Claude API
    // For now, return a dummy SQL and chart type
    return {
        sql: "SELECT * FROM sales LIMIT 10;",
        chartType: "table"
    };
};

exports.generateAnswer = async (question, result) => {
    // TODO: Use LLM to generate a natural language answer
    return "Here are the top 10 sales records.";
};
