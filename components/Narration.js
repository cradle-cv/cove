'use client';

// Narration —— 涨潮字幕渲染
// 一次只显示"当前句"（像电台字幕娓娓道来），随进度交叉淡入。
// 字幕是结构化片段，纯文本经 React 自动转义，强调段渲染为 <em>，无 HTML 注入风险。

import { activeBeatIndex } from '../lib/beats';

export default function Narration({ beats, progress, lead }) {
  const idx = activeBeatIndex(beats, progress);

  return (
    <div className="narration">
      {lead ? <div className="narration-lead">{lead}</div> : null}
      <div className="beat-wrap">
        {beats.map((b, i) => (
          <p key={i} className={'beat' + (i === idx && progress > 0.001 ? ' on' : '')}>
            {b.segments.map((s, j) =>
              s.em ? <em key={j} className="beat-em">{s.t}</em> : <span key={j}>{s.t}</span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
