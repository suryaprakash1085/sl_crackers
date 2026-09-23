/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.mp3$/i,
      type: 'asset/resource',
    });
    return config;
  },
  turbopack: {},
};

export default nextConfig;