FROM node:18-alpine

WORKDIR /app

COPY iotapp-controller/package*.json ./iotapp-controller/
RUN cd iotapp-controller && npm install --only=production

COPY iotapp-controller ./iotapp-controller
COPY encoder ./encoder
COPY decoder ./decoder

WORKDIR /app/iotapp-controller

CMD ["node", "controller.js"]