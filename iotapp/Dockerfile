FROM node:18-alpine

WORKDIR /usr/src/app

RUN npm install express request systeminformation yargs

COPY . .

# All parameters are passed down using env
CMD node ${SERVICE} ${ARGS}
