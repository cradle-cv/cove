// 海角 · 导览编排层 (Narration Guide)
// ------------------------------------------------------------
// 设计前提：不改动现有 beat() 的产物 { at, segments }。
// 导览层只是在 beat 上"再包一层元数据"，告诉播放器：
// 走到这个锚点时，音乐该"停下来让路"还是"退到身后"，讲多久，讲什么。
//
// 一条导览 cue = 一个锚点 + 一种让路模式 + 旁白内容。
// 音乐的时间轴是主轴，cue 挂在主轴的某个 progress 上被触发。

// —— 让路模式 ——
export const DUCK = 'duck';   // 压着讲：音乐不停，音量降到 duckTo，旁白讲完升回
export const HALT = 'halt';   // 停下讲：音乐暂停在锚点，旁白讲完再从原处续播

// cue 便捷构造器
// at        : 0~1，挂在歌曲进度的哪个点触发（可直接复用你 beat 的 at）
// mode      : DUCK | HALT
// text      : 旁白文案（用于字幕显示；音频版对应一段旁白音轨）
// opts:
//   src     : 旁白音频源数组（无则走"按 dur 计时的静默模拟"，先跑视觉）
//   dur     : 旁白时长(秒)。有 src 时可省略，用音频真实时长；无 src 时必填
//   duckTo  : DUCK 模式下音乐压到的音量比例，默认 0.18
//   ramp    : 音量斜坡时长(秒)，进/出都用它，默认 0.6
//   hold    : HALT 模式下，旁白讲完到音乐续播之间的静默留白(秒)，默认 0.4
export function cue(at, mode, text, opts = {}) {
  return {
    at,
    mode,
    text,
    src: opts.src || null,
    dur: opts.dur ?? null,
    duckTo: opts.duckTo ?? 0.18,
    ramp: opts.ramp ?? 0.6,
    hold: opts.hold ?? 0.4,
    _fired: false, // 运行时标记，避免同一 cue 被重复触发
  };
}

// 便捷别名，让数据写起来更贴近语义
export const halt = (at, text, opts = {}) => cue(at, HALT, text, opts);
export const duck = (at, text, opts = {}) => cue(at, DUCK, text, opts);

// 给一首歌的 cues 排序 + 复位（每次开播前调用）
export function prepareCues(cues) {
  return [...cues]
    .sort((a, b) => a.at - b.at)
    .map((c) => ({ ...c, _fired: false }));
}

// 找到"当前进度下刚跨过、且还没触发过"的下一个 cue
// 返回它在数组里的下标，没有则 -1
export function nextPendingCue(cues, progress) {
  for (let i = 0; i < cues.length; i++) {
    if (!cues[i]._fired && progress >= cues[i].at) return i;
  }
  return -1;
}
