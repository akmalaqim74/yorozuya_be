# syntax=docker/dockerfile:1
FROM node:24.14-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.14-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Never run as root inside the container.
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/server.js"]
