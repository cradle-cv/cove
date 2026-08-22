import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PoemNotes from './PoemNotes';
import PoemGallery from './PoemGallery';
import GlassTide from './GlassTide';
export const revalidate = 60;
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await supabase.from('cove_poems')
    .select('title, poet_name').eq('id', id).maybeSingle();
  return { title: data ? `${data.title} · 玻璃海滩` : '玻璃海滩 · Cove' };
}
// 日期写成 July 8th  2023 这种样子
function plateDate(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (isNaN(dt)) return '';
  const d = dt.getDate();
  const ord = d >= 11 && d <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
  return `${dt.toLocaleString('en-US', { month: 'long' })} ${d}${ord}  ${dt.getFullYear()}`;
}
export default async function GlassDetail({ params }) {
  const { id } = await params;
  const { data: p } = await supabase
    .from('cove_poems').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (!p) notFound();
  const audio = Array.isArray(p.audio_src) ? p.audio_src[0] : null;
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const hasImages = images.length > 0;
  // 长短判断：正文超过约 180 字（或超过 12 行），当作故事，左对齐；否则当诗，铺成纯色诗板
  const text = p.body || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const isStory = text.replace(/\s/g, '').length > 180 || lines.length > 12;
  const { data: notes } = await supabase
    .from('cove_poem_notes').select('id, visitor_name, body, created_at')
    .eq('poem_id', id).order('created_at', { ascending: false });
  return (
    <main className="glass-detail">
      <div className="gd-glow" aria-hidden="true">
        <span className="glow-a" /><span className="glow-b" /><span className="glow-c" />
      </div>
      <div className="gd-inner gd-centered">
        <div className="gd-eyebrow">Sea Glass</div>
        <div className={`letter-card hue-${p.letter_hue || 1}`}>
          {/* 短诗：整块纯色诗板，标题 / 日期 / 正文都在板上 */}
          {!isStory ? (
            <div className="poem-plate" style={p.glass_color ? { '--plate-color': p.glass_color } : undefined}>
              <div className="poem-plate__inner">
                <h1 className="poem-plate__title">{p.title}</h1>
                <p className="poem-plate__date">{plateDate(p.created_at)}</p>
                <div className="poem-plate__body">
                  {lines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>
          ) : null}
          {hasImages ? (
            <div className="gd-cover">
              <PoemGallery images={images} />
            </div>
          ) : null}
          {/* 故事：保持原来的标题 + 作者 + 左对齐正文 */}
          {isStory ? (
            <>
              <h1 className="gd-title">{p.title}</h1>
              <div className="gd-poet">{p.poet_name}</div>
              <article className="gd-body as-story">
                {text.split('\n').map((line, i) =>
                  line.trim() ? <p key={i}>{line}</p> : <p key={i} className="blank">&nbsp;</p>
                )}
              </article>
            </>
          ) : (
            <div className="gd-poet gd-poet--under-plate">{p.poet_name}</div>
          )}
        </div>
        {audio ? (
          <div className="poem-audio">
            <div className="pa-cap">从这首诗里长出来的音乐</div>
            <GlassTide src={audio} color={p.glass_color} />
            {p.gen_note ? <p className="pa-note">{p.gen_note}</p> : null}
          </div>
        ) : (
          <p className="poem-noaudio">这一枚还没有配上它的音乐</p>
        )}
        <PoemNotes poemId={p.id} initialNotes={notes || []} />
        <p className="glass-back"><Link href="/glass">回到滩上 →</Link></p>
      </div>
    </main>
  );
}
