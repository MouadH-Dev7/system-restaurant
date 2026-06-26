import type { NextConfig } from 'next';

const apiInternalUrl = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || '';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui', '@repo/shared-types'],
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
