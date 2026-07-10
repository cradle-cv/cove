'use client';
// 波形海面 · 涨潮字幕的浮标
// 一首歌铺成一片起伏的海。潮水漫过的地方是海玻璃绿，没漫到的是灰。
// 海面上浮着几个赭石色的点，每一个是一段涨潮字幕。
// 潮水漫过它，它自己亮起来；你也可以随时伸手点回去。
import { useRef, useEffect, useCallback } from 'react';

export default function Waveform({
  peaks,
  duration = 0,
  progress = 0,
  beats = [],
  activeBeat = -1,
  onSeek,
  onPickBeat,
}) {
  const cvRef = useRef(null);
  const hoverRef = useRef(-1);

  // 没有真实波形时，按时长生成一片稳定的假海（同一首歌每次形状一致）
  const wave = usePeaks(peaks, duration);

  const draw = useCallback(() => {
    const cv = cvRef.current;
    if (!cv || !wave.length) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bw = w / wave.length;
    for (let i = 0; i < wave.length; i++) {
      const done = i / wave.length < progress;
      ctx.fillStyle = done ? 'rgba(93,154,143,.85)' : 'rgba(26,34,41,.16)';
      const bh = Math.max(2, wave[i] * h * 0.78);
      ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1.1), bh);
    }

    beats.forEach((b, i) => {
      const x = b.at * w;
      const lit = progress >= b.at;
      const on = i === activeBeat;
      const hov = i === hoverRef.current;
      ctx.beginPath();
      ctx.arc(x, h / 2, on ? 6.5 : hov ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#A6503A' : lit ? 'rgba(166,80,58,.6)' : 'rgba(26,34,41,.3)';
      ctx.fill();
      if (on) {
        ctx.beginPath();
        ctx.arc(x, h / 2, 11, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(166,80,58,.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    if (progress > 0) {
      const nx = progress * w;
      ctx.fillStyle = '#173A47';
      ctx.fillRect(nx - 0.75, 3, 1.5, h - 6);
    }
  }, [wave, progress, beats, activeBeat]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const on = () => draw();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [draw]);

  const hit = (e) => {
    const cv = cvRef.current;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left;
    const w = cv.clientWidth;
    for (let i = 0; i < beats.length; i++) {
      if (Math.abs(beats[i].at * w - x) < 13) return { beat: i, ratio: beats[i].at };
    }
    return { beat: -1, ratio: Math.max(0, Math.min(1, x / w)) };
  };

  return (
    <canvas
      ref={cvRef}
      className="waveform"
      onClick={(e) => {
        const { beat, ratio } = hit(e);
        if (beat >= 0) onPickBeat?.(beat);
        onSeek?.(ratio);
      }}
      onMouseMove={(e) => {
        const { beat } = hit(e);
        if (beat !== hoverRef.current) {
          hoverRef.current = beat;
          cvRef.current.style.cursor = beat >= 0 ? 'pointer' : 'crosshair';
          draw();
        }
      }}
      onMouseLeave={() => { hoverRef.current = -1; draw(); }}
      aria-label="波形海面，点击浮标可读该段涨潮字幕"
    />
  );
}

// 有真实波形就用真实的；没有就按时长造一片稳定的海
function usePeaks(peaks, duration) {
  if (Array.isArray(peaks) && peaks.length > 8) return peaks;
  const n = 190;
  const out = [];
  const seed = duration || 160;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const env = p < 0.05 ? p / 0.05 : p > 0.93 ? (1 - p) / 0.07 : 1;
    const swell =
      0.34 +
      0.48 * Math.abs(Math.sin(p * Math.PI * 1.6)) +
      0.2 * Math.sin(p * (29 + (seed % 7)) + 1.7) * Math.sin(p * 7.3);
    out.push(Math.max(0.06, Math.min(1, env * swell)));
  }
  return out;
}
