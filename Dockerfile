FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY scripts ./scripts

EXPOSE 4100

CMD ["npm", "run", "dev"]
