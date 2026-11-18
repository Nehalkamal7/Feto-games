# Base Node image
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Dependencies installer
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/server/package.json ./apps/server/
COPY apps/server/prisma ./apps/server/prisma/

RUN npm install

# Build shared types & generate Prisma client
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build:types
RUN npm run db:generate --workspace=@feto-games/server
RUN npm run build:server

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@feto-games/server"]
