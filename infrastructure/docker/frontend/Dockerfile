FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN pnpm config set fetch-retries 6 \
 && pnpm config set fetch-retry-factor 2 \
 && pnpm config set fetch-retry-mintimeout 2000 \
 && pnpm config set fetch-retry-maxtimeout 60000 \
 && pnpm config set fetch-timeout 120000 \
 && pnpm config set network-concurrency 8

FROM base AS deps
ARG APP_NAME
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY backend/package.json ./backend/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/ts-config/package.json ./packages/ts-config/package.json
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY apps/customer-app/package.json ./apps/customer-app/package.json
COPY apps/kitchen-app/package.json ./apps/kitchen-app/package.json
COPY apps/pos-app/package.json ./apps/pos-app/package.json
COPY apps/waiter-app/package.json ./apps/waiter-app/package.json
RUN pnpm fetch --filter @repo/${APP_NAME}...

FROM deps AS build
ARG APP_NAME
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ARG NEXT_PUBLIC_CUSTOMER_APP_PORT=3001
ARG API_INTERNAL_URL=http://backend:4000
ENV APP_NAME=${APP_NAME}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV NEXT_PUBLIC_CUSTOMER_APP_PORT=${NEXT_PUBLIC_CUSTOMER_APP_PORT}
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY backend/package.json ./backend/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/i18n/package.json ./packages/i18n/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/ts-config/package.json ./packages/ts-config/package.json
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json
COPY apps/customer-app/package.json ./apps/customer-app/package.json
COPY apps/kitchen-app/package.json ./apps/kitchen-app/package.json
COPY apps/pos-app/package.json ./apps/pos-app/package.json
COPY apps/waiter-app/package.json ./apps/waiter-app/package.json
RUN pnpm install --filter @repo/${APP_NAME}... --prefer-offline --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/${APP_NAME} build

FROM base AS runner
ARG APP_NAME
ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}
RUN apk add --no-cache wget
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000 3001 3002 3003 3004 3005
CMD ["sh", "-c", "pnpm --filter @repo/${APP_NAME} start"]
