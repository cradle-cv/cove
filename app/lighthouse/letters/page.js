import Link from 'next/link';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import FloorShell from '../FloorShell';
import { supabase } from '@/lib/supabase';
import { getFloor } from '@/lib/site/lighthouse';

export const revalidate = 120;
export const metadata = { title: '信件室 · Cove' };

// 灯塔三层 · 信件室：漂流瓶（cove_echoes）归档。
// RLS：匿名可读挂在已发布歌曲下的漂流瓶，草稿歌曲下的读不到，这里也不依赖它们。
export default async function LettersFloorPage() {
  const { zone, lit } = await getFloor(3);

  let echoes = [];
  const trackMap = {};
  const issueOf = {};
  if (lit) {
    const { data, error } = await supabase
      .from('cove_echoes')
      .select('id, track_id, body, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    // 读不到漂流瓶时：运行时 throw，让 ISR 沿用上一版，不把空状态缓存下来；
    // 构建阶段没有上一版可沿用，先按空的生成，revalidate 到期后重新生成。
    if (error) {
      if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
        console.warn(`[lighthouse] 信件室读取失败：${error.message}（构建阶段，先按空状态生成）`);
      } else {
        throw new Error(`信件室读取失败：${error.message}`);
      }
    }
    echoes = data || [];

    const ids = [...new Set(echoes.map((e) => e.track_id).filter(Boolean))];
    if (ids.length > 0) {
      const [{ data: tracks }, { data: issues }] = await Promise.all([
        supabase.from('cove_tracks').select('id, title, musician:cove_musicians(name)').in('id', ids),
        supabase.from('cove_curations').select('id, track_ids').eq('status', 'published'),
      ]);
      (tracks || []).forEach((t) => { trackMap[t.id] = t; });
      (issues || []).forEach((it) => (it.track_ids || []).forEach((tid) => { issueOf[tid] = it.id; }));
    }
  }

  return (
    <FloorShell floor={3} en="Letter Room" zone={zone} lit={lit}>
      {echoes.length > 0 ? (
        <>
          <p className="group-note" style={{ textAlign: 'center', marginBottom: 24 }}>
            散落在各首歌里的漂流瓶最后都漂到这一排木格里，这里一共收着 {echoes.length} 只，最新投下的放在最上面。
          </p>
          <div className="letters">
            {echoes.map((e) => {
              const t = trackMap[e.track_id];
              const issueId = issueOf[e.track_id];
              return (
                <div key={e.id} className="letter-slip">
                  <p className="ls-body">{e.body}</p>
                  <div className="ls-meta">
                    {t ? (
                      issueId
                        ? <Link href={`/records/${issueId}`}>《{t.title}》{t.musician?.name ? ` · ${t.musician.name}` : ''}</Link>
                        : <span>《{t.title}》</span>
                    ) : null}
                    <span>{new Date(e.created_at).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="dredging">
          木格还空着，到现在还没有一只漂流瓶漂到这里，等你在<Link href="/records">打捞碎月</Link>某首歌的聆听页里留下一句话，它会在那首歌底下浮着，也会收进这里。
        </p>
      )}
    </FloorShell>
  );
}
