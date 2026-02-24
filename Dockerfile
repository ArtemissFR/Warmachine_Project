FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Remove invalid 'family' option, keep retries, and add verbose logging
RUN npm config set fetch-retries 5 && \
    npm install --omit=dev --loglevel verbose

COPY . .

RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
