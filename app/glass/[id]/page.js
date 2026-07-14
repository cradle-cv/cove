import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PoemNotes from './PoemNotes';
import PoemGallery from './PoemGallery';

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

  const { data: notes } = await supabase
    .from('cove_poem_notes').select('id, visitor_name, body, created_at')
    .eq('poem_id', id).order('created_at', { ascending: false });

  return (
    <main className={`glass-detail gd-${p.glass_color}`}>
      {/* 熠熠生辉的光晕背景，颜色随这枚玻璃 */}
      <div className="gd-glow" aria-hidden="true">
        <span className="glow-a" /><span className="glow-b" /><span className="glow-c" />
      </div>

      <div className="gd-inner">
        <div className="gd-eyebrow">Sea Glass</div>

        {/* 诗，安放在一枚半透明的玻璃上 */}
        <article className="glass-slab">
          <div className="slab-shine" aria-hidden="true" />
          <h1 className="gd-title">{p.title}</h1>
          <div className="gd-poet">{p.poet_name}</div>
          <div className="gd-body">
            {p.body.split('\n').map((line, i) =>
              line.trim() ? <p key={i}>{line}</p> : <p key={i} className="blank">&nbsp;</p>
            )}
          </div>
        </article>

        <PoemGallery images={p.images || []} />

        {audio ? (
          <div className="poem-audio">
            <div className="pa-cap">从这首诗里长出来的音乐</div>
            <audio controls preload="none" src={audio} />
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
