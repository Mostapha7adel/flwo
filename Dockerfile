FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

COPY apps/server/package.json apps/server/package-lock.json ./apps/server/
RUN cd apps/server && npm ci --omit=dev

COPY apps/server/prisma/ ./apps/server/prisma/
RUN cd apps/server && npx prisma generate

COPY apps/server/ ./apps/server/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

WORKDIR /app/apps/server
CMD ["node", "src/server.js"]
