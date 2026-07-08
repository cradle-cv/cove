import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '海角唱片行 · Seacove' };

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);

export default async function MusicRoomPage() {
  const { data: issues } = await supabase
    .from('cove_curations')
    .select('id, issue_number, theme_zh, theme_en, is_special, published_at')
    .eq('status', 'published')
    .order('issue_number', { ascending: false });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Record Shop</div>
        <div className="th">海角唱片行</div>
        <div className="sub">一期一个主题，几首歌，和它们没被讲完的来历。像在唱片行的木架前，一张一张把封套翻过去。</div>
        <div className="hairline" />
      </div>

      {issues && issues.length > 0 ? (
        <div className="shelf">
          {issues.map((it) => (
            <Link key={it.id} href={`/records/${it.id}`}>
              <span className="no">No. {roman(it.issue_number)}</span>
              <span className="th">{it.theme_zh}</span>
              {it.theme_en ? <span className="en">{it.theme_en}</span> : null}
              {it.is_special ? <span className="special">特刊</span> : null}
              <span className="date">
                {it.published_at ? new Date(it.published_at).toLocaleDateString('zh-CN') : ''}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <p className="dredging">下一期还在打捞中</p>
    </main>
  );
}
