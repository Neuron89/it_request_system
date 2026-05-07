import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@itr/shared'],
  devIndicators: false,
};

export default nextConfig;
