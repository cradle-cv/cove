'use client';
// 歌词 · 左栏的逐行
// 只显示当前行前后几句，其余不出现，所以它永远是一小片，不会变成一堵墙。
// 当前行加深，不加粗，不高亮。歌自己在说话，海角在旁边不打断。
const WINDOW_BEFORE = 2;
const WINDOW_AFTER = 3;

export default function Lyrics({ lines, progress = 0 }) {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const rows = lines.map((x) => (typeof x === 'string' ? { l: x } : x));

  // 当前行
  let cur = -1;
  if (rows[0]?.t != null) {
    rows.forEach((r, i) => { if (progress >= r.t) cur = i; });
  } else if (progress > 0) {
    cur = Math.min(rows.length - 1, Math.floor(progress * rows.length));
  }

  // 未播放时显示开头几句
  const anchor = cur < 0 ? 0 : cur;
  const from = Math.max(0, anchor - (cur < 0 ? 0 : WINDOW_BEFORE));
  const to = Math.min(rows.length - 1, anchor + WINDOW_AFTER);

  return (
    <div className="lyrics">
      <div className="lyrics-cap">歌 词</div>
      <div className="lyrics-body">
        {rows.slice(from, to + 1).map((r, k) => {
          const i = from + k;
          return (
            <p key={i} className={i === cur ? 'on' : ''}>{r.l}</p>
          );
        })}
      </div>
    </div>
  );
}
