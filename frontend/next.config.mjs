/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for production (Firebase Hosting)
  // Controlled via BUILD_MODE env var - set in package.json scripts
  output: process.env.BUILD_MODE === 'production' ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
