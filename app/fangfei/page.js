import Link from 'next/link';
import { supabase } from '@/lib/supabase';
export const revalidate = 120;
export const metadata = { title: '芳菲诗社 · 海角 Cove' };
// 芳菲诗社在海角的分社：她们自己的诗、自己的守滩人。
// 海角只提供地基与账号，内容与审核归诗社。
export default async function FangfeiPage() {
  const { data: poems } = await supabase
    .from('ff_poems')
    .select('id, poet_name, title, body, hue, audio_src, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (
    <main className="sheet ff">
      <div className="sheet-head">
        <div className="no">Fangfei Poetry Society · Shanghai</div>
        <div className="th">芳菲诗社</div>
        <div className="sub">
          上海的一群写诗的人，在海角借了一片滩。<br />
          这里的每一首，都由诗社自己读过、自己放上来。
        </div>
        <div className="hairline" />
      </div>
      {poems && poems.length > 0 ? (
        <div className="beach">
          {poems.map((p, i) => (
            <Link key={p.id} href={`/fangfei/${p.id}`}
              className={`letter hue-${p.hue || 1} tilt-${i % 5}`}>
              <span className="lt-title">{p.title}</span>
              <span className="lt-line">{firstLine(p.body)}</span>
              <span className="lt-poet">{p.poet_name}</span>
              {Array.isArray(p.audio_src) && p.audio_src.length ? (
                <span className="lt-sound" aria-label="有音乐" />
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="dredging">诗社的第一首还在路上</p>
      )}
      <p className="glass-submit-line">
        诗社成员可以<Link href="/fangfei/submit">把一首放上来</Link>
        <span className="ff-sep">·</span>
        <Link href="/fangfei/desk">编辑台</Link>
      </p>
    </main>
  );
}
function firstLine(body) {
  const l = (body || '').split('\n').map((x) => x.trim()).filter(Boolean)[0] || '';
  return l.length > 18 ? l.slice(0, 18) + '…' : l;
}
