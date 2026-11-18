# Base image
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Build shared types & Next.js frontend
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SERVER_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_NAME="FETO GAMES"
ARG NEXT_PUBLIC_MAX_ROOM_PLAYERS=15

ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_MAX_ROOM_PLAYERS=$NEXT_PUBLIC_MAX_ROOM_PLAYERS

RUN npm run build:types
RUN npm run build:web

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/packages/shared-types ./packages/shared-types

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@feto-games/web"]
