import Link from 'next/link';

// 灯塔内页的外壳：报头 + 未点亮时的提示 + 回到灯塔。
// 未点亮的层只露出名字和点亮条件，正文不渲染。
export default function FloorShell({ floor, en, zone, lit, children }) {
  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Floor {floor} · {en}</div>
        <div className="th">{zone?.name || ''}</div>
        {zone?.ambience ? <div className="sub">{zone.ambience}</div> : null}
        <div className="hairline" />
      </div>

      {lit ? children : (
        <p className="dredging">
          这一层还没有点亮，打捞碎月发布到第 {zone?.unlock_after ?? '?'} 期之后，灯会亮到这里。
        </p>
      )}

      <p className="floor-back"><Link href="/lighthouse">回到灯塔</Link></p>
    </main>
  );
}
