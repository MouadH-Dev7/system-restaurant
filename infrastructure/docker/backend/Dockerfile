FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache postgresql-client

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN pnpm config set fetch-retries 6 \
 && pnpm config set fetch-retry-factor 2 \
 && pnpm config set fetch-retry-mintimeout 2000 \
 && pnpm config set fetch-retry-maxtimeout 60000 \
 && pnpm config set fetch-timeout 120000 \
 && pnpm config set network-concurrency 8

FROM base AS deps
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
RUN pnpm fetch --filter @repo/backend...

FROM deps AS build
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
RUN pnpm install --filter @repo/backend... --prefer-offline --frozen-lockfile
COPY . .
RUN pnpm --filter @repo/backend prisma:generate
RUN pnpm --filter @repo/backend build

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache wget
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 4000
CMD ["sh", "-c", "pnpm --dir backend prisma migrate deploy && node backend/dist/main.js"]
