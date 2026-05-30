/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },

  // gzip/br compression of server responses (HTML, JSON, JS).
  compress: true,
  // Don't leak the framework version header.
  poweredByHeader: false,

  experimental: {
    // Transform barrel imports (e.g. lucide-react's 1000+ icons) into direct
    // per-icon imports at build time. Cuts a large amount of JS off every
    // route that imports even a handful of icons — our single biggest,
    // safest bundle win since 34 files import from lucide-react.
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
