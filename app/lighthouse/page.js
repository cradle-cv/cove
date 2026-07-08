import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '灯塔 · Seacove' };

// 同构摇篮驻地（七个沉浸区 + 等级门），海角的门换成内容本身：
// unlock_after = 需要已发布的唱片行期数。网站每出一期，灯塔亮一层。
export default async function LighthousePage() {
  const [{ data: zones }, { count }] = await Promise.all([
    supabase.from('cove_lighthouse_zones').select('*').order('floor', { ascending: false }),
    supabase.from('cove_curations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);
  const published = count || 0;

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Lighthouse</div>
        <div className="th">灯塔</div>
        <div className="sub">
          七层，自下而上。唱片行每出一期，灯塔就亮一层。<br />
          现在亮到第 {zones ? zones.filter((z) => published >= z.unlock_after).length : 0} 层。
        </div>
        <div className="hairline" />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(zones || []).map((z) => {
          const lit = published >= z.unlock_after;
          return (
            <div key={z.id} style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              border: '1px solid var(--hair)',
              opacity: lit ? 1 : 0.42, filter: lit ? 'none' : 'grayscale(.7)',
              transition: 'all .4s',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: z.scene, opacity: 0.9 }} />
              <div style={{ position: 'relative', padding: '22px 24px', color: '#F6EFE0' }}>
                <div style={{ fontFamily: 'var(--font-utility)', fontSize: 10, letterSpacing: '.3em', opacity: 0.75 }}>
                  FLOOR {z.floor}
                </div>
                <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: '.14em', marginTop: 6 }}>{z.name}</div>
                <div style={{ fontSize: 13, fontWeight: 300, marginTop: 8, opacity: 0.85, lineHeight: 1.8 }}>
                  {lit ? z.ambience : `第 ${z.unlock_after} 期之后点亮`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
