import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd3hlek06d0jfh5.cloudfront.net',
      },
    ],
  },
};

export default nextConfig;
