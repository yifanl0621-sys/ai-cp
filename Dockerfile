FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5050

COPY package.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 5050

CMD ["npm", "start"]
