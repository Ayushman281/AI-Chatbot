// Add or modify determineBestChartType function

/**
 * Determine the best chart type based on the query and results
 */
export function determineBestChartType(question, results) {
    const lowerQuestion = question.toLowerCase();

    // For count queries that return a single number
    if (results.length === 1 &&
        (results[0].count !== undefined ||
            results[0].total_count !== undefined)) {
        return 'number';
    }

    // For year-specific album queries (like our 2016 example)
    if ((lowerQuestion.includes('year') ||
        lowerQuestion.match(/\b(19|20)\d{2}\b/)) &&
        lowerQuestion.includes('album')) {
        return results.length <= 8 ? 'bar' : 'table';
    }

    // For price/cost queries
    if (lowerQuestion.includes('price') ||
        lowerQuestion.includes('expensive') ||
        lowerQuestion.includes('cost')) {
        return 'bar';
    }

    // For count or "how many" questions
    if (lowerQuestion.includes('how many') ||
        lowerQuestion.includes('count')) {
        return 'number';
    }

    // Default based on result size
    if (results.length <= 1) {
        return 'number';
    } else if (results.length <= 8) {
        return 'bar';
    } else {
        return 'table';
    }
}