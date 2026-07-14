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

export default async function GlassDetail({ params }) {
  const { id } = await params;
  const { data: p } = await supabase
    .from('cove_poems').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (!p) notFound();

  const audio = Array.isArray(p.audio_src) ? p.audio_src[0] : null;
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const hasImages = images.length > 0;

  // 长短判断：正文超过约 180 字（或超过 12 行），当作故事，左对齐；否则当诗，居中
  const text = p.body || '';
  const lineCount = text.split('\n').filter((l) => l.trim()).length;
  const isStory = text.replace(/\s/g, '').length > 180 || lineCount > 12;

  const { data: notes } = await supabase
    .from('cove_poem_notes').select('id, visitor_name, body, created_at')
    .eq('poem_id', id).order('created_at', { ascending: false });

  return (
    <main className={`glass-detail gd-${p.glass_color}`}>
      {/* 熠熠生辉的光晕背景 */}
      <div className="gd-glow" aria-hidden="true">
        <span className="glow-a" /><span className="glow-b" /><span className="glow-c" />
      </div>

      <div className="gd-inner gd-centered">
        <div className="gd-eyebrow">Sea Glass</div>

        {/* 图片：居中当封面 */}
        {hasImages ? (
          <div className="gd-cover">
            <PoemGallery images={images} />
          </div>
        ) : null}

        {/* 标题 · 署名 */}
        <h1 className="gd-title">{p.title}</h1>
        <div className="gd-poet">{p.poet_name}</div>

        {/* 正文：诗居中 / 故事左对齐 */}
        <article className={'gd-body' + (isStory ? ' as-story' : ' as-poem')}>
          {text.split('\n').map((line, i) =>
            line.trim() ? <p key={i}>{line}</p> : <p key={i} className="blank">&nbsp;</p>
          )}
        </article>

        {/* 播放器：放在正文下方，读完文字再听 */}
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
