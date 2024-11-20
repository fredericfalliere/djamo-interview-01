FROM node:20
WORKDIR /usr/src/app
COPY package*.json .
COPY tsconfig*.json .
COPY src/ .
RUN npm install
CMD npm run start:dev