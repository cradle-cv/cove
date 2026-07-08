import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 120;
export const metadata = { title: '每日音乐节 · Seacove' };

const STATUS_CN = { open: '召集中', locked: '已截稿', completed: '已成行' };

// 同构摇篮邀请函体系：制作人为一场演出发起邀请函，
// 召集乐手、歌手、词曲作者。截稿前可改报名（Rule B），截稿即锁。
export default async function FestivalPage() {
  const { data: list } = await supabase
    .from('cove_festivals')
    .select('id, title, venue, show_date, roles_needed, deadline, status')
    .in('status', ['open', 'locked', 'completed'])
    .order('show_date', { ascending: true });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Festival</div>
        <div className="th">每日音乐节</div>
        <div className="sub">
          制作人在这里发出邀请函，为一场具体的演出召集乐手、歌手与词曲作者。<br />
          截稿之前，报名随时可改；截稿之后，名单交给海。
        </div>
        <div className="hairline" />
      </div>

      {list && list.length > 0 ? (
        <div className="shelf">
          {list.map((f) => (
            <Link key={f.id} href={`/festival/${f.id}`}>
              <span className="th">{f.title}</span>
              <span className="en">{f.venue || ''}</span>
              {f.status !== 'completed' ? (
                <span className="special">{STATUS_CN[f.status]}</span>
              ) : null}
              <span className="date">
                {f.show_date ? new Date(f.show_date).toLocaleDateString('zh-CN') : ''}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      <p className="dredging">下一封邀请函还在写</p>
    </main>
  );
}
