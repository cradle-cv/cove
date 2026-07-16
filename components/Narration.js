'use client';

// Narration —— 涨潮字幕渲染
// 一次只显示"当前段"。当前段由外部给定（潮水漫过时自动推进，也可由波形浮标点选）。
// 字幕是结构化片段，纯文本经 React 自动转义，强调段渲染为 <em>，无 HTML 注入风险。

export default function Narration({ beats, index = -1, lead, hint, peeking = false, topSlot = null }) {
  const has = index >= 0 && index < beats.length;

  return (
    <div className={'narration' + (peeking ? ' peeking' : '')}>
      {topSlot}
      {lead ? <div className="narration-lead">{lead}</div> : null}
      <div className="beat-wrap">
        {beats.map((b, i) => (
          <p key={i} className={'beat' + (i === index ? ' on' : '')}>
            {b.segments.map((s, j) =>
              s.em ? <em key={j} className="beat-em">{s.t}</em> : <span key={j}>{s.t}</span>
            )}
          </p>
        ))}
        {!has && hint ? <p className="beat-hint">{hint}</p> : null}
      </div>
    </div>
  );
}
