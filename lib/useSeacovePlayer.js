'use client';

// useSeacovePlayer —— 海角播放内核
// 基于 Howler.js。负责：多曲管理、播放/暂停、淡入淡出、seek、进度上报、
// 移动端 AudioContext 解锁。UI 与字幕由调用方自己渲染，这里只给状态和方法。
//
// 用法：
//   const player = useSeacovePlayer(tracks, { volume: 0.55 });
//   player.active / player.playing / player.progress(0..1) / player.currentTime / player.duration
//   player.toggle() / player.play(i) / player.pause() / player.seek(frac) / player.setVolume(v)
//
// tracks: [{ src: ['/audio/x.webm','/audio/x.mp3'], duration?: number }]
//   - 提供 src：用 Howler 真实播放（推荐 webm + mp3 双源，覆盖全部浏览器）
//   - 不提供 src（仅 demo）：按 duration 走计时模拟，方便没有音频文件时预览

import { useEffect, useRef, useState, useCallback } from 'react';

export function useSeacovePlayer(tracks, options = {}) {
  const { volume = 0.55, fadeMs = 900 } = options;

  const howls = useRef([]);        // 懒加载的 Howl 实例
  const raf = useRef(null);
  const simStart = useRef(null);   // 模拟模式：本次播放起始时间戳
  const simBase = useRef(0);       // 模拟模式：起播时已播进度(秒)
  const volRef = useRef(volume);

  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 秒
  const [duration, setDuration] = useState(tracks[0]?.duration || 0);

  const hasSrc = useCallback((i) => Array.isArray(tracks[i]?.src) && tracks[i].src.length > 0, [tracks]);

  // 懒创建 Howl
  const getHowl = useCallback((i) => {
    if (!hasSrc(i)) return null;
    if (!howls.current[i]) {
      // 动态引入，避免 SSR 阶段触碰 window
      const { Howl } = require('howler');
      howls.current[i] = new Howl({
        src: tracks[i].src,
        html5: true,            // 长音频用流式，省内存
        preload: false,
        volume: 0,
        onend: () => { stopLoop(); setPlaying(false); },
        onplayerror: (id, err) => {
          // 移动端锁定时：等待 unlock 再播
          const h = howls.current[i];
          h && h.once('unlock', () => h.play());
        },
      });
    }
    return howls.current[i];
  }, [tracks, hasSrc]);

  const trackDuration = useCallback((i) => {
    const h = getHowl(i);
    const d = h && h.state() === 'loaded' ? h.duration() : 0;
    return d || tracks[i]?.duration || 0;
  }, [getHowl, tracks]);

  // ---- 进度循环 ----
  const stopLoop = useCallback(() => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; }, []);

  const loop = useCallback(() => {
    const i = activeRef.current;
    let t = 0;
    if (hasSrc(i)) {
      const h = getHowl(i);
      t = h ? (h.seek() || 0) : 0;
    } else {
      const dur = tracks[i]?.duration || 0;
      const elapsed = (performance.now() - simStart.current) / 1000;
      t = Math.min(dur, simBase.current + elapsed);
      if (t >= dur) { setCurrentTime(dur); setPlaying(false); stopLoop(); return; }
    }
    setCurrentTime(t);
    raf.current = requestAnimationFrame(loop);
  }, [getHowl, hasSrc, tracks, stopLoop]);

  // active 的可变引用，供 loop 读取最新值
  const activeRef = useRef(0);
  useEffect(() => { activeRef.current = active; }, [active]);

  // ---- 解锁移动端音频（在用户手势内调用）----
  const unlock = useCallback(() => {
    try {
      const { Howler } = require('howler');
      if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
    } catch (_) {}
  }, []);

  // ---- 核心控制 ----
  const startActive = useCallback(() => {
    const i = activeRef.current;
    setDuration(trackDuration(i));
    if (hasSrc(i)) {
      const h = getHowl(i);
      unlock();
      h.volume(0);
      h.play();
      h.fade(0, volRef.current, fadeMs);
    } else {
      simStart.current = performance.now();
      simBase.current = currentTimeRef.current;
    }
    setPlaying(true);
    stopLoop();
    raf.current = requestAnimationFrame(loop);
  }, [getHowl, hasSrc, trackDuration, unlock, fadeMs, loop, stopLoop]);

  const currentTimeRef = useRef(0);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);

  const pause = useCallback(() => {
    const i = activeRef.current;
    if (hasSrc(i)) {
      const h = getHowl(i);
      if (h) { h.fade(h.volume(), 0, fadeMs); setTimeout(() => h.pause(), fadeMs); }
    }
    setPlaying(false);
    stopLoop();
  }, [getHowl, hasSrc, fadeMs, stopLoop]);

  // 播放指定曲（切歌）。i 省略则播当前曲。
  const play = useCallback((i) => {
    const target = (typeof i === 'number') ? i : activeRef.current;
    // 切歌：先停旧曲
    if (target !== activeRef.current) {
      const prev = activeRef.current;
      if (hasSrc(prev)) { const ph = getHowl(prev); ph && ph.stop(); }
      activeRef.current = target;
      setActive(target);
      setCurrentTime(0);
      currentTimeRef.current = 0;
    } else if (currentTimeRef.current >= (trackDuration(target) - 0.05)) {
      // 同曲且已播完 → 从头
      if (hasSrc(target)) { const h = getHowl(target); h && h.seek(0); }
      setCurrentTime(0); currentTimeRef.current = 0;
    }
    startActive();
  }, [getHowl, hasSrc, trackDuration, startActive]);

  const toggle = useCallback(() => { playing ? pause() : play(); }, [playing, pause, play]);

  // 切到某曲但不一定播放（滚动切屏时用）
  const select = useCallback((i) => {
    if (i === activeRef.current) return;
    if (playing) {
      const prev = activeRef.current;
      if (hasSrc(prev)) { const ph = getHowl(prev); ph && ph.stop(); }
      setPlaying(false);
      stopLoop();
    }
    activeRef.current = i;
    setActive(i);
    setCurrentTime(0); currentTimeRef.current = 0;
    setDuration(trackDuration(i));
  }, [playing, getHowl, hasSrc, trackDuration, stopLoop]);

  // seek 到 0..1
  const seek = useCallback((frac) => {
    const i = activeRef.current;
    const dur = trackDuration(i);
    const t = Math.max(0, Math.min(1, frac)) * dur;
    if (hasSrc(i)) { const h = getHowl(i); h && h.seek(t); }
    else { simBase.current = t; simStart.current = performance.now(); }
    setCurrentTime(t); currentTimeRef.current = t;
  }, [getHowl, hasSrc, trackDuration]);

  const setVolume = useCallback((v) => {
    volRef.current = v;
    const i = activeRef.current;
    if (hasSrc(i)) { const h = getHowl(i); h && h.volume(v); }
  }, [getHowl, hasSrc]);

  // 卸载清理
  useEffect(() => () => {
    stopLoop();
    howls.current.forEach((h) => h && h.unload());
    howls.current = [];
  }, [stopLoop]);

  const dur = duration || trackDuration(active) || 0;
  return {
    active, playing, currentTime, duration: dur,
    progress: dur ? currentTime / dur : 0,
    play, pause, toggle, select, seek, setVolume, unlock,
  };
}
