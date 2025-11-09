FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production

COPY . .

EXPOSE 3089

CMD ["yarn", "start"]
