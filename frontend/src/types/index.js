/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {number} timestamp
 * @property {boolean} [isLoading]
 * @property {string} [error]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} id
 * @property {string} title
 * @property {Message[]} messages
 */

/**
 * @typedef {Object.<string, any>} DataItem
 */

/**
 * @typedef {Object} QueryResponse
 * @property {string} answer
 * @property {DataItem[]} [result]
 * @property {'bar' | 'line' | 'pie' | 'table' | null} [chartType]
 * @property {string} [sql]
 * @property {string} [error]
 */

/**
 * @typedef {Object} ChartData
 * @property {DataItem[]} data
 * @property {'bar' | 'line' | 'pie' | 'table' | null} chartType
 * @property {string} [sql]
 */

// Export empty objects to maintain module structure
export const types = {};