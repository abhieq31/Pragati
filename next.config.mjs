/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['mongoose', 'mongodb-memory-server'],
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
