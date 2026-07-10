import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);

export default async function HomePage() {
  // 首页显示哪一期：后台勾了「显示在首页」就用那一期；
  // 没有勾任何一期时，退回期号最大的已发布期。
  const cols = 'id, issue_number, theme_zh, theme_en, intro, published_at, envelope_color';

  const { data: featured } = await supabase
    .from('cove_curations')
    .select(cols)
    .eq('status', 'published')
    .eq('is_featured', true)
    .maybeSingle();

  let latest = featured;
  if (!latest) {
    const { data: fallback } = await supabase
      .from('cove_curations')
      .select(cols)
      .eq('status', 'published')
      .order('issue_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    latest = fallback;
  }

  const stampDate = latest?.published_at ? new Date(latest.published_at) : new Date();
  const dd = String(stampDate.getDate()).padStart(2, '0');
  const mm = String(stampDate.getMonth() + 1).padStart(2, '0');

  return (
    <main className="home">
      <section className="home-hero">
        <div className="hero-eyebrow">写歌的人，靠岸的地方</div>
        <div className="hero-logo">
          <img className="hero-tri" src="/logo-tri.png" alt="海角 Cove" />
          <img className="hero-word" src="/logo-text.png" alt="" />
        </div>
        <p className="hero-tagline">
          一期几首歌，讲清楚它们的来历。<br />
          写歌的人在这里认识彼此，有时候一起去演出。
        </p>
      </section>

      <section className="mailbox">
        <div className="mail-label">— 本期来信 —</div>

        {latest ? (
          <article className={`envelope env-${latest.envelope_color || 'kraft'}`}>
            <div className="stamp">
              <div className="stamp-inner">
                <img src="/cove-icon-white.png" alt="" />
                <span className="stamp-txt">COVE.GE</span>
              </div>
            </div>

            <div className="postmark" aria-hidden="true">
              <span className="pm-top">SEACOVE</span>
              <span className="pm-date">{dd}·{mm}</span>
              <span className="pm-bot">打捞碎月</span>
            </div>

            <div className="letter-to">
              <div className="no">Seacove No. {roman(latest.issue_number)}</div>
              <h2 className="th">{latest.theme_zh}</h2>
              {latest.theme_en ? <div className="en">{latest.theme_en}</div> : null}
              {latest.intro ? <p className="intro">{latest.intro}</p> : null}
              <Link className="open-letter" href={`/records/${latest.id}`}>
                拆开这封信 →
              </Link>
            </div>

            <div className="wax-seal" aria-hidden="true">角</div>
          </article>
        ) : (
          <p className="dredging">第一封信还没有写完</p>
        )}

        {latest ? (
          <p className="past-letters">
            往期的信收在<Link href="/records">打捞碎月</Link>
          </p>
        ) : null}
      </section>

      <section className="home-links">
        <Link href="/festival">
          <span className="hl-cn">每日演出</span>
          <span className="hl-desc">有人在找乐手，有人在找场地</span>
        </Link>
        <Link href="/records">
          <span className="hl-cn">打捞碎月</span>
          <span className="hl-desc">每期几首，连同它们的来历</span>
        </Link>
        <Link href="/dock">
          <span className="hl-cn">原创码头</span>
          <span className="hl-desc">音乐人自己发的歌</span>
        </Link>
        <Link href="/musicians">
          <span className="hl-cn">音乐人</span>
          <span className="hl-desc">停靠过这里的人</span>
        </Link>
      </section>
    </main>
  );
}
