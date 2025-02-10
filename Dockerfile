FROM node:23.7-alpine
USER node

RUN mkdir -p /home/node/app
RUN mkdir -p /home/node/app/data

WORKDIR /home/node/app

COPY . .

RUN npm install

CMD [ "npm", "run", "start" ]
