export const ANALYTICS_CACHE_TTL_SECONDS = 60 * 5;

export function analyticsCacheKey(restaurantId: string, scope: string) {
  return `analytics:${restaurantId}:${scope}`;
}
