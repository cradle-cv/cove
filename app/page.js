import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);

export default async function HomePage() {
  const { data: latest } = await supabase
    .from('cove_curations')
    .select('id, issue_number, theme_zh, theme_en, intro')
    .eq('status', 'published')
    .order('issue_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Seacove</div>
        <div className="th">海角</div>
        <div className="sub">
          一个关于音乐创作、赏析与情感分享的港湾。<br />
          不做推荐，不追热榜。每一期，认真讲清楚几首歌的来历。
        </div>
        <div className="hairline" />
      </div>

      {latest ? (
        <div className="shelf">
          <Link href={`/records/${latest.id}`}>
            <span className="no">No. {roman(latest.issue_number)}</span>
            <span className="th">{latest.theme_zh}</span>
            {latest.theme_en ? <span className="en">{latest.theme_en}</span> : null}
            <span className="date">本期 · 进入音乐房</span>
          </Link>
        </div>
      ) : (
        <p className="dredging">第一期还在打捞中</p>
      )}

      <div className="sheet-head" style={{ marginTop: 72 }}>
        <div className="sub">
          <Link href="/records">海角唱片行</Link> 收录每一期的歌与故事。
          <Link href="/dock" style={{ marginLeft: 14 }}>原创码头</Link> 停靠音乐人的原创与手记。
          <Link href="/radio" style={{ marginLeft: 14 }}>海角电台</Link> 记录不赶时间的对话。
        </div>
      </div>
    </main>
  );
}
