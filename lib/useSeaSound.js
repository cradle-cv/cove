'use client';
// 海声的接线
// 只在没有音频的曲目上响。这首歌你听不到，但你能听见它所在的那片海。
// 真音频进来了，海自己退场。
import { useEffect, useRef, useState, useCallback } from 'react';
import { createSeaSound } from './seaSound';

export function useSeaSound(track, { enabled = true, hasAudio = false, volume = 0.5 } = {}) {
  const ctxRef = useRef(null);
  const seaRef = useRef(null);
  const [on, setOn] = useState(false);      // 是否正在出声
  const [ready, setReady] = useState(false); // 浏览器是否已解锁音频

  const recipe = track?.sea_sound || null;
  const shouldPlay = enabled && !hasAudio && !!recipe;

  const stop = useCallback(() => {
    if (seaRef.current) { seaRef.current.stop(); seaRef.current = null; }
    setOn(false);
  }, []);

  // 浏览器要求用户先有一次交互才能出声
  const unlock = useCallback(async () => {
    if (ctxRef.current) return ctxRef.current;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') await ctx.resume();
    ctxRef.current = ctx;
    setReady(true);
    return ctx;
  }, []);

  const play = useCallback(async () => {
    if (!recipe) return;
    const ctx = await unlock();
    stop();
    const sea = createSeaSound(ctx, recipe);
    sea.node.connect(ctx.destination);
    sea.duck(volume, 0.01);
    sea.start(2.4);
    seaRef.current = sea;
    setOn(true);
  }, [recipe, unlock, stop, volume]);

  // 换歌就换海
  useEffect(() => {
    if (!shouldPlay) { stop(); return; }
    if (!ready) return; // 等用户先点一次
    play();
    return stop;
  }, [shouldPlay, ready, recipe, play, stop]);

  // 离页收声
  useEffect(() => () => {
    stop();
    ctxRef.current?.close?.();
  }, [stop]);

  return {
    available: !!recipe && !hasAudio,
    on,
    // 第一次点亮需要用户交互；之后是开关
    toggle: () => (on ? stop() : play()),
  };
}
