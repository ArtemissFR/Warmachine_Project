FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

# The "Nuclear" fix: Hardcode registry IPs to bypass DNS issues
RUN echo "104.16.0.34 registry.npmjs.org" >> /etc/hosts && \
    npm config set fetch-retries 5 && \
    npm install --omit=dev --loglevel verbose

COPY . .

RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
