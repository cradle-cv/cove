import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FESTIVAL_MATCH } from '@/lib/site/copy';

export const revalidate = 120;
export const metadata = { title: '每日演出 · Cove' };

const STATUS_CN = { open: '召集中', locked: '已截稿', completed: '已成行' };

// 三类邀请函
const TYPE_CN = {
  gig_call:     { label: '演出征人', desc: '为一场具体的演出，召集歌手、乐手与词曲作者' },
  band_recruit: { label: '乐团招募', desc: '音乐人发起，为一支正在成形的乐队找同路人' },
  venue_offer:  { label: '场地承接', desc: '酒吧与音乐场馆敞开的门，等一场演出落地' },
};

// 六种身份
const ROLE_CN = {
  singer: '歌手', instrumentalist: '乐手', producer: '制作人',
  bar: '酒吧', music_company: '音乐公司', promoter: '演出机构',
};

export default async function FestivalPage() {
  const { data: list } = await supabase
    .from('cove_festivals')
    .select('id, title, venue, show_date, roles_needed, deadline, status, invite_type, organizer_role')
    .in('status', ['open', 'locked', 'completed'])
    .order('show_date', { ascending: true });

  // 按日期把邀请函分成「还在路上的」和「已经过去的」：
  // show_date 早于今天（北京时间）的归到页面下方，不再显示可报名；
  // status 仍是 open 但截稿时间已过的，显示为「已截稿」。
  const now = new Date();
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
  const isPast = (f) => !!f.show_date && String(f.show_date).slice(0, 10) < today;
  const stateOf = (f) => {
    if (f.status === 'completed') return 'completed';
    if (f.status === 'locked') return 'locked';
    if (f.deadline && new Date(f.deadline) <= now) return 'locked';
    return 'open';
  };

  const upcoming = (list || []).filter((f) => !isPast(f));
  const past = (list || []).filter(isPast).sort((a, b) => (a.show_date < b.show_date ? 1 : -1));

  const byType = { gig_call: [], band_recruit: [], venue_offer: [] };
  upcoming.forEach((f) => {
    (byType[f.invite_type] || byType.gig_call).push(f);
  });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Live at the Cove</div>
        <div className="th">每日演出</div>
        <div className="sub">
          歌手、乐手、制作人、酒吧、音乐公司、演出机构，在这里互相找到。<br />
          一张邀请函，截稿之前报名随时可改；截稿之后，名单交给海。
        </div>
        <div className="hairline" />
      </div>

      {['gig_call', 'band_recruit', 'venue_offer'].map((tk) => (
        <section key={tk} className="invite-block">
          <div className="invite-head">
            <h3 className="invite-type">{TYPE_CN[tk].label}</h3>
            <span className="invite-desc">{TYPE_CN[tk].desc}</span>
          </div>

          {byType[tk].length > 0 ? (
            <div className="shelf">
              {byType[tk].map((f) => (
                <Link key={f.id} href={`/festival/${f.id}`}>
                  <span className="th">{f.title}</span>
                  <span className="en">
                    {f.organizer_role ? `${ROLE_CN[f.organizer_role] || ''} · ` : ''}{f.venue || ''}
                  </span>
                  {stateOf(f) !== 'completed' ? (
                    <span className="special">{STATUS_CN[stateOf(f)]}</span>
                  ) : null}
                  <span className="date">
                    {f.show_date ? new Date(f.show_date).toLocaleDateString('zh-CN') : ''}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="invite-empty">这一类的邀请函还没寄到</p>
          )}
        </section>
      ))}

      {past.length > 0 ? (
        <section className="invite-block past">
          <div className="invite-head">
            <h3 className="invite-type">已经过去的演出</h3>
            <span className="invite-desc">演出日期已过，这些邀请函只留作记录，不再接受报名</span>
          </div>
          <div className="shelf">
            {past.map((f) => (
              <Link key={f.id} href={`/festival/${f.id}`}>
                <span className="th">{f.title}</span>
                <span className="en">
                  {TYPE_CN[f.invite_type]?.label || ''}{f.venue ? ` · ${f.venue}` : ''}
                </span>
                <span className="gone">{f.status === 'completed' ? '已成行' : '已过去'}</span>
                <span className="date">
                  {f.show_date ? new Date(f.show_date).toLocaleDateString('zh-CN') : ''}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="match-note">
        <h4>{FESTIVAL_MATCH.title}</h4>
        <p>
          {FESTIVAL_MATCH.p}
          <Link href="/apply">去身份申请页 →</Link>
        </p>
      </section>

      <p className="dredging">下一封邀请函还在写</p>
    </main>
  );
}
