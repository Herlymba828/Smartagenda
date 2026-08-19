FROM node:20-alpine AS deps

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./
RUN npm install --production
 
# Expose HTTP port
EXPOSE 3000/tcp
ENV NODE_ENV=production
CMD ["npm", "run", "start:prod"]
