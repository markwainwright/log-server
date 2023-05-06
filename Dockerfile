FROM node:18.16.0-alpine AS base
USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

FROM base as builder
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM base as installer
COPY package.json package-lock.json ./
RUN npm ci --omit dev

FROM base as release
USER root
RUN apk add --no-cache tini
USER node
COPY package.json ./
COPY --from=builder /home/node/app/dist/ ./
COPY --from=installer /home/node/app/node_modules/ ./node_modules/

EXPOSE 8080
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
