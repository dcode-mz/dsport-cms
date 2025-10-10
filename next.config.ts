import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  // Disable static generation for pages that require API calls
  trailingSlash: false,
  // server: {
  //   actions: {
  //     allowedOrigins: ["localhost:3998"],
  //   },
  // },
  // env: {
  //   CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  //   CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  //   CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  // },
};

export default nextConfig;
