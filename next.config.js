/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 · cove 桶的公开开发域名（当前在用）
      { protocol: 'https', hostname: 'pub-63a4210287b8429cb7f2bf81493b8fbe.r2.dev' },
      // 将来若把 R2 绑到自定义域，改用这个
      { protocol: 'https', hostname: 'cdn.cove.ge' }
    ]
  }
};
module.exports = nextConfig;
