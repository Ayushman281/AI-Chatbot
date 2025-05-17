# AI Data Agent - Business Intelligence Chatbot

An advanced conversational AI system that answers complex business questions from SQL databases with natural language responses and relevant visualizations.

## Overview

This AI Data Agent is designed to handle:
- Complex database structures and poor schema design
- Poorly named columns/tables (like tbl1, col1)
- Inconsistent and messy data
- Vague analytical questions from users

The system transforms natural language questions into SQL queries, executes them against the database, and provides both natural language answers and appropriate visualizations.

## Features

- 💬 **Conversational Interface**: Maintains context for follow-up questions
- 🔍 **Natural Language to SQL**: Converts questions to database queries
- 📊 **Dynamic Visualizations**: Generates relevant charts based on data type
- 📝 **Query History**: Tracks previous questions and answers
- 🔄 **Contextual Follow-ups**: Handles questions that reference previous results
- 🧠 **Explanation System**: Provides transparency into query generation
- ⚠️ **Robust Error Handling**: Gracefully manages unclear questions or data issues

## Tech Stack

- **Frontend**: React with Vite, Chart.js for visualizations
- **Backend**: Node.js with Express
- **Database**: PostgreSQL running in Docker with Chinook database
- **AI Integration**: LangChain for NL-to-SQL conversion
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-data-agent.git
   cd ai-data-agent
   ```

2. Copy the example environment file
   ```bash
   cp .env.example .env
   ```
   
3. Update the `.env` file with your API keys and configuration

4. Access the application at [http://localhost:3000](http://localhost:3000)

## System Architecture

```
User Question → NLP Processing → SQL Generation → Query Execution → Result Processing → Visualization → User Response
```

### Key Components

1. **NLP Service**: Processes user questions and extracts intent
2. **SQL Generation Service**: Converts processed questions to SQL
3. **Database Service**: Executes queries and retrieves data
4. **Visualization Service**: Creates appropriate charts based on data type
5. **Response Generator**: Transforms results into natural language

## Example Questions

The system can handle complex questions like:

- "What are the top 5 best-selling tracks of all time?"
- "Show me the revenue by country over the last year"
- "Which genres have the highest average track price?"
- "Who are our most valuable customers based on lifetime purchase value?"
- "Compare sales performance between different media types"

## Database Schema

The system works with the Chinook database, a sample database representing a digital media store with tables such as:
- Artist (artists who created music albums)
- Album (music albums)
- Track (individual songs/tracks)
- Customer (store customers)
- Invoice & InvoiceLine (sales information)
- Employee (staff members)
- Genre & MediaType (classification data)
- Playlist & PlaylistTrack (user playlists)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.