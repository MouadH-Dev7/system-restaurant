import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || '';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared-types'],
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  async rewrites() {
    const destination =
      process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

    return [
      {
        source: '/api/:path*',
        destination: `${destination}/:path*`,
      },
    ];
  },
};

export default nextConfig;
