const SITE = 'https://cove.ge';

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/me', '/studio', '/compose', '/api', '/fangfei/desk', '/fangfei/submit', '/glass/submit'] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
