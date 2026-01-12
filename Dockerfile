FROM node:18-alpine

WORKDIR /app

COPY server/package.json .
RUN npm install

COPY server/server.js .

COPY index.html styles.css app.js ./public/

EXPOSE 3000

CMD ["node", "server.js"]
