import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlassTide from '@/app/glass/[id]/GlassTide';
export const revalidate = 60;
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await supabase.from('ff_poems').select('title').eq('id', id).maybeSingle();
  return { title: data ? `${data.title} · 港口甲` : '港口甲' };
}
// 日期写成 二〇二三年七月八日
const CN = '〇一二三四五六七八九';
const cnNum = (n) => String(n).split('').map((d) => CN[+d]).join('');
const cnDay = (n) => (n <= 10 ? (n === 10 ? '十' : CN[n]) : n < 20 ? '十' + CN[n % 10]
  : CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : ''));
function cnDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d)) return '';
  return `${cnNum(d.getFullYear())}年${cnDay(d.getMonth() + 1)}月${cnDay(d.getDate())}日`;
}
export default async function HarborADetail({ params }) {
  const { id } = await params;
  const { data: p } = await supabase
    .from('ff_poems').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (!p) notFound();
  const audio = Array.isArray(p.audio_src) ? p.audio_src[0] : null;
  const text = p.body || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  // 短诗竖排成一张笺；长故事横排
  const isStory = text.replace(/\s/g, '').length > 180 || lines.length > 12;
  const hue = `hue-${p.hue || 1}`;
  return (
    <main className="ff-main">
      {!isStory ? (
        <article className={`ff-sheet ${hue}`}>
          <span className="ff-slip-thread" aria-hidden="true" />
          <div className="ff-sheet-v">
            <h1 className="ff-sheet-title">{p.title}</h1>
            <div className="ff-sheet-body">
              {lines.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
          <div className="ff-sheet-foot">
            <span className="ff-sheet-date">{cnDate(p.published_at || p.created_at)}</span>
            <span className="ff-sheet-poet">{p.poet_name}</span>
            <span className="ff-seal" aria-hidden="true">甲</span>
          </div>
        </article>
      ) : (
        <article className={`ff-sheet ff-sheet--story ${hue}`}>
          <span className="ff-slip-thread" aria-hidden="true" />
          <h1 className="ff-story-title">{p.title}</h1>
          <div className="ff-story-meta">
            <span>{p.poet_name}</span>
            <span>{cnDate(p.published_at || p.created_at)}</span>
          </div>
          <div className="ff-story-body">
            {text.split('\n').map((line, i) =>
              line.trim() ? <p key={i}>{line}</p> : <p key={i} className="blank">&nbsp;</p>
            )}
          </div>
          <div className="ff-sheet-foot"><span className="ff-seal" aria-hidden="true">甲</span></div>
        </article>
      )}
      {audio ? (
        <div className="ff-audio">
          <div className="ff-audio-cap">从这首诗里长出来的音乐</div>
          <GlassTide src={audio} hue={p.hue} />
          {p.gen_note ? <p className="ff-audio-note">{p.gen_note}</p> : null}
        </div>
      ) : null}
      <p className="ff-back"><Link href="/fangfei">← 回到笺架</Link></p>
    </main>
  );
}
