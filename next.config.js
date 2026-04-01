/** @type {import('next').NextConfig} */
const nextConfig = {
  // copy everything from your .ts file here
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
