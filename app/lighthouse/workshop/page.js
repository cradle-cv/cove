import FloorShell from '../FloorShell';
import { getFloor } from '@/lib/site/lighthouse';
import { WORKSHOP } from '@/lib/site/copy';

export const revalidate = 300;
export const metadata = { title: '机械室 · Cove' };

// 灯塔五层 · 机械室：一期是怎么做出来的（流程，不写具体轶事）
export default async function WorkshopFloorPage() {
  const { zone, lit } = await getFloor(5);
  return (
    <FloorShell floor={5} en="Engine Room" zone={zone} lit={lit}>
      <article className="prose">
        <p className="lead">{WORKSHOP.lead}</p>
        <ol className="steps">
          {WORKSHOP.steps.map((s) => (
            <li key={s.h}>
              <span className="st-h">{s.h}</span>
              {s.p}
            </li>
          ))}
        </ol>
      </article>
    </FloorShell>
  );
}
