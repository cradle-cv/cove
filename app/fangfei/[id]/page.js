import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GlassTide from '@/app/glass/[id]/GlassTide';
export const revalidate = 60;
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await supabase.from('ff_poems').select('title').eq('id', id).maybeSingle();
  return { title: data ? `${data.title} · 芳菲诗社` : '芳菲诗社 · 海角 Cove' };
}
function plateDate(value) {
  if (!value) return '';
  const dt = new Date(value);
  if (isNaN(dt)) return '';
  const d = dt.getDate();
  const ord = d >= 11 && d <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] || 'th';
  return `${dt.toLocaleString('en-US', { month: 'long' })} ${d}${ord}  ${dt.getFullYear()}`;
}
export default async function FangfeiDetail({ params }) {
  const { id } = await params;
  const { data: p } = await supabase
    .from('ff_poems').select('*').eq('id', id).eq('status', 'published').maybeSingle();
  if (!p) notFound();
  const audio = Array.isArray(p.audio_src) ? p.audio_src[0] : null;
  const text = p.body || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const isStory = text.replace(/\s/g, '').length > 180 || lines.length > 12;
  const hue = `hue-${p.hue || 1}`;
  return (
    <main className="glass-detail ff">
      <div className="gd-inner gd-centered">
        <div className="gd-eyebrow">Fangfei · Shanghai</div>
        {!isStory ? (
          <div className={`poem-plate ${hue}`}>
            <div className="poem-plate__inner">
              <h1 className="poem-plate__title">{p.title}</h1>
              <p className="poem-plate__date">{plateDate(p.published_at || p.created_at)}</p>
              <div className="poem-plate__body">
                {lines.map((line, i) => <p key={i}>{line}</p>)}
              </div>
              <div className="poem-plate__poet">{p.poet_name}</div>
            </div>
          </div>
        ) : (
          <div className={`letter-card ${hue}`}>
            <h1 className="gd-title">{p.title}</h1>
            <div className="gd-poet">{p.poet_name}</div>
            <article className="gd-body as-story">
              {text.split('\n').map((line, i) =>
                line.trim() ? <p key={i}>{line}</p> : <p key={i} className="blank">&nbsp;</p>
              )}
            </article>
          </div>
        )}
        {audio ? (
          <div className="poem-audio">
            <div className="pa-cap">从这首诗里长出来的音乐</div>
            <GlassTide src={audio} hue={p.hue} />
            {p.gen_note ? <p className="pa-note">{p.gen_note}</p> : null}
          </div>
        ) : (
          <p className="poem-noaudio">这一首还没有配上它的音乐</p>
        )}
        <p className="glass-back"><Link href="/fangfei">回到诗社 →</Link></p>
      </div>
    </main>
  );
}
