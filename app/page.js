import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);

export default async function HomePage() {
  const { data: latest } = await supabase
    .from('cove_curations')
    .select('id, issue_number, theme_zh, theme_en, intro, published_at')
    .eq('status', 'published')
    .order('issue_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stampDate = latest?.published_at ? new Date(latest.published_at) : new Date();
  const dd = String(stampDate.getDate()).padStart(2, '0');
  const mm = String(stampDate.getMonth() + 1).padStart(2, '0');

  return (
    <main className="home">
      <section className="home-hero">
        <div className="hero-eyebrow">从海面下打捞每一首歌的故事</div>
        <div className="hero-logo">
          <img className="hero-tri" src="/logo-tri.png" alt="海角 Cove" />
          <img className="hero-word" src="/logo-text.png" alt="" />
        </div>
        <p className="hero-tagline">
          每一期，像一封从海角寄来的信。<br />
          拆开它，读几首歌，和它们没被讲完的来历。
        </p>
      </section>

      <section className="mailbox">
        <div className="mail-label">— 本期来信 · A LETTER FROM THE COVE —</div>

        {latest ? (
          <article className="envelope">
            <div className="stamp">
              <div className="stamp-inner">
                <img src="/cove-icon-white.png" alt="" />
                <span className="stamp-txt">COVE.GE</span>
              </div>
            </div>

            <div className="postmark" aria-hidden="true">
              <span className="pm-top">SEACOVE</span>
              <span className="pm-date">{dd}·{mm}</span>
              <span className="pm-bot">海角唱片行</span>
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
          <p className="dredging">第一封信还在海上</p>
        )}
      </section>

      <section className="home-links">
        <Link href="/records">
          <span className="hl-cn">海角唱片行</span>
          <span className="hl-desc">收录每一期的歌与故事</span>
        </Link>
        <Link href="/dock">
          <span className="hl-cn">原创码头</span>
          <span className="hl-desc">停靠音乐人的原创与手记</span>
        </Link>
        <Link href="/radio">
          <span className="hl-cn">海角电台</span>
          <span className="hl-desc">记录不赶时间的对话</span>
        </Link>
      </section>
    </main>
  );
}
