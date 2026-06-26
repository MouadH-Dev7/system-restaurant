FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

RUN pnpm config set fetch-retries 6 \
 && pnpm config set fetch-retry-factor 2 \
 && pnpm config set fetch-retry-mintimeout 2000 \
 && pnpm config set fetch-retry-maxtimeout 60000 \
 && pnpm config set fetch-timeout 120000 \
 && pnpm config set network-concurrency 8

FROM base AS build
COPY . .
RUN sh -c 'for attempt in 1 2 3; do \
  pnpm install --filter @repo/backend... --frozen-lockfile=false && exit 0; \
  echo "pnpm install failed for backend (attempt ${attempt}/3), retrying..."; \
  sleep 5; \
done; \
exit 1'
RUN pnpm --filter @repo/backend prisma:generate
RUN pnpm --filter @repo/backend build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 4000
CMD ["sh", "-c", "pnpm --dir backend prisma migrate deploy && node backend/dist/main.js"]
