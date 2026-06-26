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
ARG APP_NAME
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ARG API_INTERNAL_URL=http://backend:4000
ENV APP_NAME=${APP_NAME}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
COPY . .
RUN sh -c 'for attempt in 1 2 3; do \
  pnpm install --filter @repo/${APP_NAME}... --frozen-lockfile=false && exit 0; \
  echo "pnpm install failed for ${APP_NAME} (attempt ${attempt}/3), retrying..."; \
  sleep 5; \
done; \
exit 1'
RUN pnpm --filter @repo/${APP_NAME} build

FROM base AS runner
ARG APP_NAME
ENV NODE_ENV=production
ENV APP_NAME=${APP_NAME}
COPY --from=build /app /app
EXPOSE 3000 3001 3002 3003 3004 3005
CMD ["sh", "-c", "pnpm --filter @repo/${APP_NAME} start"]
