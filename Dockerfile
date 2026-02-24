# Node runtime
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Create data directory for SQLite
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
