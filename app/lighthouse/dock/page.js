import Link from 'next/link';
import FloorShell from '../FloorShell';
import { getFloor } from '@/lib/site/lighthouse';
import { DOCK } from '@/lib/site/copy';

export const metadata = {
  title: '船坞 · 关于海角 · Cove',
  description: '海角的来历：名字、字标、站长，以及各个板块是做什么的。',
};

// 灯塔一层 · 船坞：海角的来历（关于页）
export default async function DockFloorPage() {
  // 一层永远点亮，getFloor(1) 不发查询，这一页可以纯静态
  const { zone, lit } = await getFloor(1);
  return (
    <FloorShell floor={1} en="The Dock" zone={zone} lit={lit}>
      <article className="prose">
        <p className="lead">{DOCK.lead}</p>

        {DOCK.origin.map((s) => (
          <section key={s.h}>
            <h3>{s.h}</h3>
            <p>{s.p}</p>
          </section>
        ))}

        <h3>{DOCK.sectionsTitle}</h3>
        <ul className="board-list">
          {DOCK.sections.map((s) => (
            <li key={s.name}>
              <span className="bl-name">
                {s.href ? <Link href={s.href}>{s.name}</Link> : s.name}
              </span>
              <span className="bl-p">{s.p}</span>
            </li>
          ))}
        </ul>

        <h3>{DOCK.copyrightTitle}</h3>
        <p>{DOCK.copyright}</p>
      </article>
    </FloorShell>
  );
}
