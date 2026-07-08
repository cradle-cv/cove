// beats —— 海角"涨潮字幕"的数据与选择逻辑
//
// 字幕不再用内嵌 HTML（如 <span class='em'>），改成结构化片段，杜绝 XSS：
//
//   {
//     at: 0.58,                     // 何时浮现（占整曲进度 0..1）
//     segments: [
//       { t: "老人听完只说，这调子" },
//       { t: "像涨潮", em: true },  // em 标记强调，由组件用 <em> 渲染
//       { t: "。后来这三个字成了歌名。" }
//     ]
//   }
//
// 这样所有文案都是纯文本，React 自动转义；强调是数据属性，不是标签。

// 按当前进度选出"当前应显示"的那一句（最后一个 at <= progress 的 beat 下标）
export function activeBeatIndex(beats, progress) {
  let idx = -1;
  for (let i = 0; i < beats.length; i++) {
    if (progress >= beats[i].at) idx = i; else break;
  }
  return idx;
}

// 便捷构造：把 "纯文本｜强调｜纯文本" 这种写法转成 segments
// 用法：beat(0.58, "老人听完只说，这调子|像涨潮|。后来这三个字成了歌名。", [1])
// 第三个参数是"哪些段是强调"的下标数组。
export function beat(at, parts, emphasis = []) {
  const arr = Array.isArray(parts) ? parts : String(parts).split('|');
  return {
    at,
    segments: arr.map((t, i) => (emphasis.includes(i) ? { t, em: true } : { t })),
  };
}
