import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '灯塔 · Cove' };

// 七层，自下而上，随打捞碎月的期数逐层点亮。
// 每一层都有自己的用处：
// 1 船坞(来历) 2 守塔人的桌子(手记) 3 信件室(漂流瓶归档)
// 4 海图室(全站索引) 5 机械室(幕后) 6 瞭望台(预告) 7 灯室(点灯仪式)
export default async function LighthousePage() {
  const [{ data: zones }, { count: published }, { count: echoes }] = await Promise.all([
    supabase.from('cove_lighthouse_zones').select('*').order('floor', { ascending: false }),
    supabase.from('cove_curations').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('cove_echoes').select('id', { count: 'exact', head: true }),
  ]);
  const pub = published || 0;
  const litCount = (zones || []).filter((z) => pub >= z.unlock_after).length;

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Lighthouse</div>
        <div className="th">灯塔</div>
        <div className="sub">
          七层，自下而上。打捞碎月每出一期，灯塔就亮一层。<br />
          现在亮到第 {litCount} 层。
        </div>
        <div className="hairline" />
      </div>

      <div className="tower">
        {(zones || []).map((z) => {
          const lit = pub >= z.unlock_after;
          return (
            <section key={z.id} className={`floor${lit ? ' lit' : ''}`}>
              <div className="floor-no">FLOOR {z.floor}</div>
              <h3 className="floor-name">{z.name}</h3>

              {lit ? (
                <>
                  <p className="floor-fn">{z.scene}</p>
                  <p className="floor-air">{z.ambience}</p>

                  {/* 各层的入口 */}
                  {z.floor === 3 ? (
                    <p className="floor-extra">已归档 {echoes || 0} 只漂流瓶</p>
                  ) : null}
                  {z.floor === 4 ? (
                    <p className="floor-extra">
                      <Link href="/records?view=instruments">按主奏乐器查看 →</Link>
                      <Link href="/records?view=musicians">按音乐人查看 →</Link>
                    </p>
                  ) : null}
                  {z.floor === 6 ? (
                    <p className="floor-extra">
                      <Link href="/festival">正在酝酿的演出 →</Link>
                      <Link href="/harbors">邻港的动静 →</Link>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="floor-locked">第 {z.unlock_after} 期之后点亮</p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
