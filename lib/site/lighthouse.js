import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { supabase } from '@/lib/supabase';

// 灯塔各层的内页路由。没有列在这里的层（四层海图室、六层瞭望台）
// 仍然只在灯塔页上给出站内其他页面的链接。
export const FLOOR_ROUTES = {
  1: '/lighthouse/dock',
  2: '/lighthouse/desk',
  3: '/lighthouse/letters',
  5: '/lighthouse/workshop',
};

// 一层船坞 unlock_after 为 0，永远点亮，不依赖任何查询。
const DOCK_ZONE = { floor: 1, name: '船坞', ambience: '潮水拍着船底，木头有盐的味道', unlock_after: 0 };

// 读某一层的设定和点亮状态：已发布期数 >= unlock_after 即点亮。
// 页面是 ISR：查询出错时直接 throw，让 Next 沿用上一版缓存，
// 不把「读不到」误判成「未点亮」再缓存下来。
export async function getFloor(floor) {
  if (floor === 1) return { zone: DOCK_ZONE, lit: true, published: null };

  const [zoneRes, countRes] = await Promise.all([
    supabase.from('cove_lighthouse_zones').select('*').eq('floor', floor).maybeSingle(),
    supabase.from('cove_curations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);
  const problem =
    zoneRes.error ? `灯塔 ${floor} 层读取失败：${zoneRes.error.message}`
    : countRes.error ? `已发布期数读取失败：${countRes.error.message}`
    : !zoneRes.data ? `灯塔 ${floor} 层不存在`
    : null;
  if (problem) {
    // 构建时还没有上一版可以沿用，throw 会让整次构建失败；
    // 这时先按未点亮出一版，revalidate 到期后在运行时重新生成。
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
      console.warn(`[lighthouse] ${problem}（构建阶段，先按未点亮生成）`);
      return { zone: zoneRes.data || { floor, name: '', unlock_after: null }, lit: false, published: 0 };
    }
    throw new Error(problem);
  }

  const published = countRes.count || 0;
  return { zone: zoneRes.data, lit: published >= zoneRes.data.unlock_after, published };
}
