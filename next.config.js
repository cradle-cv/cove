/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.cove.ge' }
    ]
  }
};
module.exports = nextConfig;
