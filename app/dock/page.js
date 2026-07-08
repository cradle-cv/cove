import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '原创码头 · Seacove' };

// 同构摇篮"当代作品集"：原创码头，音乐人的作品，作品与创作手记一体
export default async function DockPage() {
  const { data: works } = await supabase
    .from('cove_works')
    .select('id, title, creation_note, cove_musicians(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Dock</div>
        <div className="th">原创码头</div>
        <div className="sub">停靠原创音乐人的作品。每一首靠岸的歌，都带着一份创作手记，作品与故事一体。</div>
        <div className="hairline" />
      </div>
      {works && works.length > 0 ? (
        <div className="shelf">
          {works.map((w) => (
            <a key={w.id} href={`/dock/${w.id}`}>
              <span className="th">{w.title}</span>
              <span className="en">{w.cove_musicians?.name}</span>
            </a>
          ))}
        </div>
      ) : null}
      <p className="dredging">码头正在等第一艘船</p>
    </main>
  );
}
