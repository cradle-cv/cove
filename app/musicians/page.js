import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '音乐人 · Seacove' };

export default async function MusiciansPage() {
  const { data: list } = await supabase
    .from('cove_musicians')
    .select('id, name, name_en, origin')
    .eq('status', 'active')
    .order('created_at');

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Musicians</div>
        <div className="th">音乐人</div>
        <div className="sub">在海角停靠过的人。有人写歌，有人唱歌，有人只是路过听了很久。</div>
        <div className="hairline" />
      </div>
      {list && list.length > 0 ? (
        <div className="shelf">
          {list.map((m) => (
            <a key={m.id} href={`/musicians/${m.id}`}>
              <span className="th">{m.name}</span>
              {m.name_en ? <span className="en">{m.name_en}</span> : null}
              <span className="date">{m.origin || ''}</span>
            </a>
          ))}
        </div>
      ) : null}
      <p className="dredging">名单还很短，海很大</p>
    </main>
  );
}
