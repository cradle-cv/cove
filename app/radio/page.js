import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '海角电台 · Seacove' };

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const roman = (n) => ROMAN[n - 1] || String(n);

// 同构摇篮杂志社：专栏在这里变成主持人专访
export default async function RadioPage() {
  const { data: list } = await supabase
    .from('cove_interviews')
    .select('id, episode_no, title, summary, published_at, cove_musicians(name)')
    .eq('status', 'published')
    .order('episode_no', { ascending: false });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Radio</div>
        <div className="th">海角电台</div>
        <div className="sub">主持人和一位音乐人，一个下午，一段不赶时间的对话。文字先到，声音在路上。</div>
        <div className="hairline" />
      </div>

      {list && list.length > 0 ? (
        <div className="shelf">
          {list.map((ep) => (
            <Link key={ep.id} href={`/radio/${ep.id}`}>
              {ep.episode_no ? <span className="no">No. {roman(ep.episode_no)}</span> : null}
              <span className="th">{ep.title}</span>
              {ep.cove_musicians?.name ? <span className="en">对话 {ep.cove_musicians.name}</span> : null}
              <span className="date">
                {ep.published_at ? new Date(ep.published_at).toLocaleDateString('zh-CN') : ''}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <p className="dredging">下一位客人还在来的路上</p>
    </main>
  );
}
