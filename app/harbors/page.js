import Link from 'next/link';
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
          {list.map((p) => {
            // 站内的港（如 /fangfei）用 Link 同窗打开；站外的另开一窗
            const internal = p.link_url && p.link_url.startsWith('/');
            const inner = (
              <>
                <span className="th">{p.name}</span>
                <span className="en">{p.kind || ''}</span>
                <span className="date">{p.city || ''}</span>
                {p.intro ? <span className="harbor-intro">{p.intro}</span> : null}
              </>
            );
            return internal ? (
              <Link key={p.id} href={p.link_url} className={p.intro ? 'has-intro' : undefined}>{inner}</Link>
            ) : (
              <a key={p.id} href={p.link_url || '#'} target="_blank" rel="noreferrer" className={p.intro ? 'has-intro' : undefined}>{inner}</a>
            );
          })}
        </div>
      ) : null}
      <p className="dredging">邻港的灯亮着，等船来</p>
      <p className="prose-cta">
        <Link href="/harbors/open">诗社、乐队和厂牌，也可以在海角开一座港 →</Link>
      </p>
    </main>
  );
}
