'use client';

// useGuidedNarration —— 导览编排器
// ------------------------------------------------------------
// 架在你现有的 useSeacoverPlayer 之上，不改内核。它做四件事：
//   1. 盯着歌曲 progress，跨过某个 cue 的锚点就触发它
//   2. HALT：暂停歌曲 → 播旁白 → 留白 → 续播
//      DUCK：把歌曲音量斜坡压到 duckTo → 播旁白 → 斜坡升回
//   3. 播旁白：有 src 用真实音频，无 src 按 dur 静默计时（先跑视觉）
//   4. 暴露 activeCue（当前正在讲的那条）给字幕层，讲话时歌词淡出
//
// 依赖约定（你的 useSeacoverPlayer 已具备这些能力）：
//   player.playing         : boolean
//   player.progress        : 0~1
//   player.pause()         : 暂停歌曲
//   player.play(i)         : 播放/续播（传当前 active 索引即可续播）
//   player.active          : 当前曲目索引
//   player.setVolume(v)    : 设歌曲主音量(0~1)——用于 duck 的斜坡由本 hook 自己插值
//   player.baseVolume      : 用户设定的正常音量（duck 结束后要回到它）
//
// 若 setVolume 是即时的，本 hook 用 requestAnimationFrame 做斜坡；
// 若你的内核用的是 Howler fade，也可以把 rampVolume 换成一行 howl.fade()。

import { useEffect, useRef, useState, useCallback } from 'react';
import { prepareCues, nextPendingCue, HALT, DUCK } from './guide';

export function useGuidedNarration(player, rawCues, { enabled = true } = {}) {
  const cuesRef = useRef([]);
  const [activeCue, setActiveCue] = useState(null); // 正在讲的 cue（给字幕层用）
  const [narrating, setNarrating] = useState(false);
  const busyRef = useRef(false);       // 正在执行一条 cue，避免并发
  const narrAudioRef = useRef(null);   // 旁白音频对象
  const rafRef = useRef(null);

  // 每首歌 / 每次开播，复位 cues
  useEffect(() => {
    cuesRef.current = prepareCues(rawCues || []);
    setActiveCue(null);
    setNarrating(false);
    busyRef.current = false;
  }, [rawCues, player.active]);

  // —— 音量斜坡（歌曲主音量）——
  const rampVolume = useCallback(
    (from, to, seconds) =>
      new Promise((resolve) => {
        const t0 = performance.now();
        const ms = Math.max(1, seconds * 1000);
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms);
          player.setVolume(from + (to - from) * k);
          if (k < 1) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        rafRef.current = requestAnimationFrame(step);
      }),
    [player]
  );

  // —— 播一段旁白：有 src 放音频，无 src 静默等 dur 秒 ——
  const speak = useCallback((c) => {
    return new Promise((resolve) => {
      if (c.src && c.src.length) {
        const a = new Audio();
        a.src = c.src[0];
        narrAudioRef.current = a;
        a.onended = resolve;
        a.onerror = resolve; // 音频挂了也别卡住流程
        // 移动端：旁白也要在用户手势链内解锁，这里假设整条流程由点击发起
        a.play().catch(resolve);
      } else {
        const ms = Math.max(300, (c.dur ?? 3) * 1000);
        const id = setTimeout(resolve, ms);
        narrAudioRef.current = { _timer: id };
      }
    });
  }, []);

  const stopSpeak = useCallback(() => {
    const n = narrAudioRef.current;
    if (!n) return;
    if (n._timer) clearTimeout(n._timer);
    else { try { n.pause(); } catch (_) {} }
    narrAudioRef.current = null;
  }, []);

  // —— 执行一条 cue ——
  const runCue = useCallback(
    async (c) => {
      busyRef.current = true;
      c._fired = true;
      setActiveCue(c);
      setNarrating(true);

      if (c.mode === HALT) {
        player.pause();
        await speak(c);
        // 讲完的留白
        await new Promise((r) => setTimeout(r, c.hold * 1000));
        setActiveCue(null);
        setNarrating(false);
        // 从原处续播
        player.play(player.active);
      } else if (c.mode === DUCK) {
        const base = player.baseVolume ?? 0.55;
        await rampVolume(base, c.duckTo, c.ramp);
        await speak(c);
        await rampVolume(c.duckTo, base, c.ramp);
        setActiveCue(null);
        setNarrating(false);
      }

      busyRef.current = false;
    },
    [player, speak, rampVolume]
  );

  // —— 主循环：盯进度，到点触发 ——
  useEffect(() => {
    if (!enabled) return;
    if (!player.playing) return;
    if (busyRef.current) return;

    const idx = nextPendingCue(cuesRef.current, player.progress);
    if (idx >= 0) {
      runCue(cuesRef.current[idx]);
    }
  }, [enabled, player.playing, player.progress, runCue]);

  // —— 清理 ——
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSpeak();
    };
  }, [stopSpeak]);

  // 用户中途关掉导览：停旁白、复位音量、清状态
  const disable = useCallback(() => {
    stopSpeak();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setActiveCue(null);
    setNarrating(false);
    busyRef.current = false;
    player.setVolume(player.baseVolume ?? 0.55);
    if (!player.playing) player.play(player.active);
  }, [player, stopSpeak]);

  return { activeCue, narrating, disable };
}
