'use client';
// 歌词 · 侧栏的低语
// 涨潮字幕是海角的叙述，是这一页唯一被强调的文本。
// 歌词是歌自己的文本，压在一侧，像唱片内页折起来的那张纸——
// 你想读就掀开它，不想读，它就是背景的一部分。
import { useState } from 'react';

export default function Lyrics({ lines, progress = 0 }) {
  const [open, setOpen] = useState(false);
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const rows = lines.map((x) => (typeof x === 'string' ? { l: x } : x));

  // 当前行：有时间点就按时间点，否则按播放进度均分
  const cur = (() => {
    if (rows[0]?.t != null) {
      let idx = -1;
      rows.forEach((r, i) => { if (progress >= r.t) idx = i; });
      return idx;
    }
    return progress > 0 ? Math.min(rows.length - 1, Math.floor(progress * rows.length)) : -1;
  })();

  return (
    <div className={'lyrics' + (open ? ' open' : '')}>
      <div className="lyrics-panel" aria-hidden={!open}>
        <div className="lyrics-cap">歌 词</div>
        <div className="lyrics-body">
          {rows.map((r, i) => (
            <p key={i} className={i === cur ? 'on' : ''}>{r.l}</p>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="lyrics-tab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '收 起' : '歌 词'}
      </button>
    </div>
  );
}
