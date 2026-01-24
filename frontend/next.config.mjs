/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export disabled for development with dynamic routes
  // For production: uncomment output: 'export' and use generateStaticParams
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
