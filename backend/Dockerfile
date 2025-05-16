FROM node:18-alpine

WORKDIR /app

# Install dependencies first, for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Create logs directory for winston
RUN mkdir -p logs

# Expose port for the application
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
