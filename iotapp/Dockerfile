FROM node:18-alpine

WORKDIR /app

# Dépendances du controller
COPY iotapp-controller/package*.json ./iotapp-controller/
RUN cd iotapp-controller && npm install --only=production

# Code + manifests
COPY iotapp-controller ./iotapp-controller
COPY encoder ./encoder
COPY decoder ./decoder

WORKDIR /app/iotapp-controller
CMD ["node", "controller.js"]
