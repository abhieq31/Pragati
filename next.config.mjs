/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'mongodb-memory-server']
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
