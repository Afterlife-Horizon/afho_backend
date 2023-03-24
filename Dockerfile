FROM node:18-alpine 

WORKDIR /app/webapp
COPY webapp/package.json ./
RUN npm install
COPY webapp/ ./

RUN npm run build

WORKDIR /app
COPY ./package.json .
RUN npm install
COPY . ./

EXPOSE 3000
CMD ["npm", "start"]