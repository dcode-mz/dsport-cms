import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // experimental: {
  //   serverActions: {
  //     bodySizeLimit: "2mb",
  //   },
  // },
  // serverRuntimeConfig: {
  //   cloudinary: {
  //     cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  //     apiKey: process.env.CLOUDINARY_API_KEY,
  //     apiSecret: process.env.CLOUDINARY_API_SECRET,
  //   },
  // },
  // publicRuntimeConfig: {
  //   cloudinary: {
  //     cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  //   },
  // },
  images: {
    domains: ["res.cloudinary.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
