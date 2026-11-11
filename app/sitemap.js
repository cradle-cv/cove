import { supabase } from '@/lib/supabase';

const SITE = 'https://cove.ge';
export const revalidate = 3600;

// 静态路由（不含个人或管理页面；未点亮的灯塔层和两个筹备页先不列）
const STATIC = [
  '', '/records', '/festival', '/dock', '/glass', '/musicians', '/radio',
  '/lighthouse', '/lighthouse/dock', '/lighthouse/desk', '/lighthouse/letters',
  '/harbors', '/harbors/open', '/fangfei',
];

export default async function sitemap() {
  const [{ data: issues }, { data: musicians }] = await Promise.all([
    supabase.from('cove_curations').select('id, published_at').eq('status', 'published'),
    supabase.from('cove_musicians').select('id, created_at').eq('status', 'active'),
  ]);

  return [
    ...STATIC.map((p) => ({ url: `${SITE}${p}`, changeFrequency: 'weekly' })),
    ...(issues || []).map((it) => ({
      url: `${SITE}/records/${it.id}`,
      lastModified: it.published_at ? new Date(it.published_at) : undefined,
      changeFrequency: 'monthly',
    })),
    ...(musicians || []).map((m) => ({
      url: `${SITE}/musicians/${m.id}`,
      lastModified: m.created_at ? new Date(m.created_at) : undefined,
      changeFrequency: 'monthly',
    })),
  ];
}
