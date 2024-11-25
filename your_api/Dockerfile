FROM node:20
WORKDIR /usr/src/app
COPY package*.json .
COPY tsconfig*.json .
COPY src/ .
COPY prisma/ .
RUN npm install
RUN npx prisma generate 
CMD npm run start