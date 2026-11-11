import Link from 'next/link';
import { GOODS } from '@/lib/site/copy';

export const metadata = {
  title: '海角好物 · Cove',
  description: '海角准备做的实物方向，筹备中，尚未上架。',
};

// 筹备中：没有商品、不接预订、不写价格
export default function GoodsPage() {
  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Goods from the Cove</div>
        <div className="th">海角好物</div>
        <div className="sub">几样将来能拿在手里的东西。</div>
        <div className="soon-mark">筹备中 · 尚未上架</div>
        <div className="hairline" />
      </div>
      <article className="prose">
        <p className="lead">{GOODS.p}</p>
      </article>
      <p className="prose-cta"><Link href="/apply">去身份申请页 →</Link></p>
    </main>
  );
}
