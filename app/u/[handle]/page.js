import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const revalidate = 120;

const ROLE_CN = { songwriter: '词曲者', performer: '歌手/乐手', producer: '制作人', organization: '音乐机构' };

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const { data } = await supabase.from('cove_public_profiles')
    .select('username').eq('handle', handle).maybeSingle();
  return { title: `${data?.username || handle} · Cove` };
}

export default async function UserPage({ params }) {
  const { handle } = await params;
  const { data: p } = await supabase.from('cove_public_profiles')
    .select('*').eq('handle', handle).maybeSingle();
  if (!p) notFound();

  // 这个人发布的海玻璃 + 音乐人身份的曲目
  const { data: poems } = await supabase.from('cove_poems')
    .select('id, title, glass_color, audio_src')
    .eq('status', 'published')
    .eq('poet_name', p.username || '')
    .order('created_at', { ascending: false });

  const name = p.username || handle;
  const roles = p.roles || [];

  return (
    <main className="sheet u-page">
      <div className="u-head">
        <div className="u-avatar">
          {p.avatar_url ? <img src={p.avatar_url} alt="" /> : <span>{name.slice(0, 1)}</span>}
        </div>
        <h1 className="u-name">{name}</h1>
        {roles.length ? (
          <div className="u-roles">{roles.map((r) => ROLE_CN[r] || r).join(' · ')}</div>
        ) : null}
        {p.bio ? <p className="u-bio">{p.bio}</p> : null}
        {p.links ? <p className="u-links"><a href={p.links} target="_blank" rel="noreferrer">{p.links}</a></p> : null}
        <div className="hairline" />
      </div>

      {poems && poems.length > 0 ? (
        <section className="u-section">
          <h2 className="u-sec-title">海玻璃</h2>
          <div className="beach">
            {poems.map((poem, i) => (
              <Link key={poem.id} href={`/glass/${poem.id}`}
                className={`glass g-${poem.glass_color} tilt-${i % 5}`}>
                <span className="g-title">{poem.title}</span>
                {Array.isArray(poem.audio_src) && poem.audio_src.length ? <span className="g-sound" /> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <p className="dredging">这个人还没有公开的作品</p>
      )}
    </main>
  );
}
