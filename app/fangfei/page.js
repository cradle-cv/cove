import Link from 'next/link';
import { supabase } from '@/lib/supabase';
export const revalidate = 120;
// 诗社首页：一排排竖立的笺，只露题目和署名。
export default async function Harbor APage() {
  const { data: poems } = await supabase
    .from('ff_poems')
    .select('id, poet_name, title, hue, audio_src, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  return (
    <main className="ff-main">
      <div className="ff-intro">
        <p>一群写诗的人。这里的每一首，都由诗社自己读过、自己放上来。</p>
      </div>
      {poems && poems.length > 0 ? (
        <div className="ff-rack">
          {poems.map((p) => (
            <Link key={p.id} href={`/fangfei/${p.id}`} className={`ff-slip hue-${p.hue || 1}`}>
              <span className="ff-slip-thread" aria-hidden="true" />
              <span className="ff-slip-title">{p.title}</span>
              <span className="ff-slip-poet">{p.poet_name}</span>
              {Array.isArray(p.audio_src) && p.audio_src.length ? (
                <span className="ff-slip-sound" aria-label="有音乐" />
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="ff-empty">第一张笺还在路上</p>
      )}
    </main>
  );
}
