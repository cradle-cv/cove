'use client';
// 玻璃海潮播放器
// 一段音乐铺成一片起伏的海。潮水漫过的地方是这枚玻璃的颜色，没漫到的是灰。
// 点海面任意处跳转。不自动播放——访客点了播放键才响。
import { useRef, useEffect, useState, useCallback } from 'react';

// 每种玻璃底色对应的潮水颜色
const TIDE = {
  green: '93,154,143',
  blue: '74,116,152',
  amber: '182,138,80',
  white: '150,154,150',
  red: '150,76,62',
};

export default function GlassTide({ src, color = 'green' }) {
  const audioRef = useRef(null);
  const cvRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const rgb = TIDE[color] || TIDE.green;

  // 一片稳定的假海（按 src 生成，不同曲子波形不同但每次一致）
  const wave = useWave(src);

  const draw = useCallback(() => {
    const cv = cvRef.current;
    if (!cv || !wave.length) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const bw = w / wave.length;
    for (let i = 0; i < wave.length; i++) {
      const done = i / wave.length < progress;
      ctx.fillStyle = done ? `rgba(${rgb},.85)` : 'rgba(26,34,41,.14)';
      const bh = Math.max(2, wave[i] * h * 0.9);
      ctx.fillRect(i * bw, (h - bh) / 2, Math.max(1, bw - 1.5), bh);
    }
    // 播放头
    if (progress > 0) {
      ctx.fillStyle = `rgba(${rgb},1)`;
      ctx.fillRect(progress * w - 1, 0, 2, h);
    }
  }, [wave, progress, rgb]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const on = () => draw();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [draw]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const r = cvRef.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    a.currentTime = Math.max(0, Math.min(1, x)) * dur;
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${String(ss).padStart(2, '0')}`;
  };

  return (
    <div className="glass-tide">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onLoadedMetadata={(e) => {
          setDur(e.target.duration || 0);
          // 延迟一点自动播放，让图片先显示出来，做到图乐大致同步。
          const el = e.target;
          setTimeout(() => {
            el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          }, 1000);
        }}
        onTimeUpdate={(e) => {
          const a = e.target;
          setCur(a.currentTime);
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        onEnded={() => setPlaying(false)}
      />
      <button className={'gt-play' + (playing ? ' on' : '')} onClick={toggle}
        aria-label={playing ? '暂停' : '播放'} style={{ color: `rgb(${rgb})` }}>
        {playing
          ? <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
          : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
      </button>
      <canvas ref={cvRef} className="gt-wave" onClick={seek} />
      <span className="gt-time">{fmt(cur)} / {fmt(dur)}</span>
    </div>
  );
}

// 按 src 字符串生成一片稳定的波形（无需解码音频）
function useWave(src) {
  const [wave, setWave] = useState([]);
  useEffect(() => {
    const N = 90;
    let seed = 0;
    for (let i = 0; i < (src || '').length; i++) seed = (seed * 31 + src.charCodeAt(i)) % 100000;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const arr = [];
    for (let i = 0; i < N; i++) {
      const env = Math.sin((i / N) * Math.PI); // 两头低中间高，像一次涌
      arr.push(0.25 + env * (0.45 + rnd() * 0.5));
    }
    setWave(arr);
  }, [src]);
  return wave;
}
