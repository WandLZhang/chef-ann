/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Uncomment for production static export
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
