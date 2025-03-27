FROM node:16-alpine

WORKDIR /app

# Kopiér package.json og package-lock.json
COPY package.json package-lock.json* ./

# Installér afhængigheder
RUN npm install

# Kopiér resten af applikationen
COPY . .

# Åbn port 3000
EXPOSE 3000

# Start applikationen
CMD ["node", "server.js"]