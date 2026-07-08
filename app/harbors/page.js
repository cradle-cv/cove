import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '邻港 · Seacove' };

export default async function HarborsPage() {
  const { data: list } = await supabase
    .from('cove_partners')
    .select('id, name, kind, city, intro, link_url')
    .eq('status', 'active')
    .order('created_at');

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Neighboring Harbors</div>
        <div className="th">邻港</div>
        <div className="sub">相邻的港口，各自有灯，互相照见。厂牌、唱片行、演出空间与写字的人。</div>
        <div className="hairline" />
      </div>
      {list && list.length > 0 ? (
        <div className="shelf">
          {list.map((p) => (
            <a key={p.id} href={p.link_url || '#'} target="_blank" rel="noreferrer">
              <span className="th">{p.name}</span>
              <span className="en">{p.kind || ''}</span>
              <span className="date">{p.city || ''}</span>
            </a>
          ))}
        </div>
      ) : null}
      <p className="dredging">邻港的灯亮着，等船来</p>
    </main>
  );
}
