import Link from 'next/link';
import { HARBOR_OPEN } from '@/lib/site/copy';

export const metadata = {
  title: '开一座港 · 邻港 · Cove',
  description: '诗社、乐队和厂牌可以在海角开一座自审自发的港。',
};

export default function OpenHarborPage() {
  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Open a Harbor</div>
        <div className="th">开一座港</div>
        <div className="sub">像港口甲那样，在海角旁边点一盏自己的灯。</div>
        <div className="hairline" />
      </div>

      <article className="prose">
        <p className="lead">
          {HARBOR_OPEN.lead}
          <span className="dim">（可以先去<Link href="/fangfei">港口甲</Link>看看一座港开起来是什么样子。）</span>
        </p>

        <h3>{HARBOR_OPEN.offerTitle}</h3>
        <ul>{HARBOR_OPEN.offer.map((t) => <li key={t}>{t}</li>)}</ul>

        <h3>{HARBOR_OPEN.dutyTitle}</h3>
        <ul>{HARBOR_OPEN.duty.map((t) => <li key={t}>{t}</li>)}</ul>

        <h3>{HARBOR_OPEN.applyTitle}</h3>
        <p>{HARBOR_OPEN.apply}</p>
      </article>

      <p className="prose-cta"><Link href="/apply">去身份申请页 →</Link></p>
      <p className="floor-back"><Link href="/harbors">回到邻港</Link></p>
    </main>
  );
}
