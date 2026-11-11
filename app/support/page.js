import { SUPPORT } from '@/lib/site/copy';

export const metadata = {
  title: '守塔人 · Cove',
  description: '听众支持海角的方式，筹备中，目前不收款。',
};

// 筹备中：不接支付，不写价格
export default function SupportPage() {
  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Lighthouse Keepers</div>
        <div className="th">守塔人</div>
        <div className="sub">给愿意支持海角的听众留的位置。</div>
        <div className="soon-mark">筹备中 · 尚未开张</div>
        <div className="hairline" />
      </div>
      <article className="prose">
        <p className="lead">{SUPPORT.p}</p>
      </article>
    </main>
  );
}
