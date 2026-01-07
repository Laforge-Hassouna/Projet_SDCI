FROM node:18-alpine

WORKDIR /app

COPY controller.js .
COPY package.json .

RUN npm install

CMD ["node", "controller.js"]
