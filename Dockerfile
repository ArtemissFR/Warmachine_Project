FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Force IPv4 and increase retries for DNS stability
RUN npm config set family 4 && \
    npm config set fetch-retries 5 && \
    npm install --omit=dev

COPY . .

RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
