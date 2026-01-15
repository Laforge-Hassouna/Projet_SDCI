FROM node:18-alpine

WORKDIR /app

# Dépendances
COPY package*.json ./
RUN npm install --only=production

# Code du controller + encoder/decoder
COPY . .

CMD ["node", "controller.js"]
