# AI Data Agent - Solution Architecture

## Overview

The AI Data Agent is a chat-based interface that allows users to query a complex database using natural language. The system translates user questions into SQL queries, executes them against a deliberately messy database schema, and presents the results in an appropriate format (tables or visualizations).

## System Components

### Frontend
- **Technology**: React.js with Material UI
- **Key Components**:
  - Chat interface for natural language queries
  - Query history sidebar
  - Result visualization components (tables, charts)
  - Suggestion buttons for sample queries
  - Error handling and feedback mechanisms
- **State Management**: React Context API for global state
- **API Integration**: Axios for backend communication

### Backend
- **Technology**: Node.js with Express
- **Key Services**:
  - REST API endpoints (/ask, /health, etc.)
  - LLM integration service for query translation
  - Database service for executing SQL and retrieving schema
  - Error handling and logging middleware
- **Authentication**: Basic request validation
- **Logging**: Morgan for HTTP logging, custom logger for application events

### Database
- **Technology**: PostgreSQL
- **Schema Design**: 
  - Deliberately "messy" schema with non-standard naming conventions
  - Tables: albm (albums), trk (tracks), artist, customer, invoice, inv_line, etc.
  - Complex relationships with foreign key constraints
  - Inconsistent column naming (e.g., "ttle" instead of "title", "F_NAME" instead of "first_name")
- **Sample Data**: Music catalog data (artists, albums, tracks, invoices)

### LLM Integration
- **Model**: DeepSeek Chimera (tngtech/deepseek-r1t-chimera:free)
- **API Interface**: OpenRouter API for model access
- **Prompt Engineering**:
  - Specialized prompt templates for SQL generation
  - Schema information inclusion
  - Example query mappings for improved accuracy
  - Two-pass validation approach for query correction

## Data Flow

1. **Query Submission**:
   - User submits a natural language question via the chat interface
   - Frontend sends question to backend API

2. **Query Processing**:
   - Backend enriches question with schema context
   - LLM generates SQL based on the question and schema
   - Error correction mechanism validates and fixes SQL syntax

3. **Query Execution**:
   - Backend executes the SQL against PostgreSQL database
   - Results are captured and formatted

4. **Response Delivery**:
   - SQL query and results are returned to frontend
   - Frontend renders appropriate visualization based on data type
   - Error feedback if query fails

## Technology Stack Details

### Frontend
- **React** (18.x): Core UI framework
- **Material UI** (5.x): Component library
- **Chart.js**: Data visualization
- **Axios**: HTTP client
- **React Router**: Navigation
- **React Markdown**: Rendering markdown responses

### Backend
- **Node.js** (18.x): Runtime environment
- **Express** (4.x): Web framework
- **pg**: PostgreSQL client
- **Axios**: HTTP client for LLM API
- **Cors**, **Helmet**, **Compression**: Security and performance middleware
- **Morgan**: HTTP request logger
- **Dotenv**: Environment configuration

### Database
- **PostgreSQL** (17.x): Relational database
- **DB Schema**: Chinook-based music store with modified naming

### DevOps
- **Nodemon**: Development auto-restart
- **ESLint**: Code quality
- **Git**: Version control

## Key Features

### Natural Language Query Processing
- Translates plain English questions into SQL
- Handles complex joins, aggregations, and filtering
- Adapts to deliberately messy database schema

### Schema-Aware Query Generation
- Maintains awareness of non-standard table and column names
- Converts standard SQL patterns to match actual schema
- Includes comprehensive schema context in LLM prompts

### Robust Error Handling
- Two-pass query validation
- Fallback mechanisms for query failures
- Clear error messaging

### Interactive Results
- Dynamic visualization selection based on query type
- Table view for raw data
- Charts for aggregate data

## Implementation Challenges

### Schema Complexity
- Non-standard naming conventions required specialized prompt engineering
- Foreign key relationships needed careful mapping in queries
- Schema context significantly increased prompt size

### LLM Integration
- Model responses required parsing and validation
- SQL syntax errors needed automatic correction
- Context window limitations required efficient schema representation

### Query Performance
- Complex queries needed optimization
- Result size management for large datasets
- Error recovery strategies for failed queries

## Future Enhancements

- Advanced visualization options
- Query history persistence
- User authentication and personalization
- Schema learning and adaptation
- Additional database support
