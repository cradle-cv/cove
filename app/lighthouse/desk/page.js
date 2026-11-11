import FloorShell from '../FloorShell';
import { getFloor } from '@/lib/site/lighthouse';
import { LOGBOOK } from '@/lib/site/logbook';

export const revalidate = 300;
export const metadata = { title: '守塔人的桌子 · Cove' };

// 灯塔二层 · 守塔人的桌子：站点手记，按日期倒序
export default async function DeskFloorPage() {
  const { zone, lit } = await getFloor(2);
  const entries = [...LOGBOOK].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <FloorShell floor={2} en="Keeper's Desk" zone={zone} lit={lit}>
      <p className="group-note" style={{ textAlign: 'center', marginBottom: 24 }}>
        守塔人的值班日志只记站里真实发生过的事，日期照数据库里的发布记录写，按北京时间计。
      </p>
      <ol className="logbook">
        {entries.map((e) => (
          <li key={e.date + e.text.slice(0, 6)}>
            <time dateTime={e.date}>{e.date.replaceAll('-', '.')}</time>
            <p>{e.text}</p>
          </li>
        ))}
      </ol>
    </FloorShell>
  );
}
