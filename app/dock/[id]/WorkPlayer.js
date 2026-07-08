'use client';

// 码头作品播放（单曲，复用 useSeacovePlayer）
import { useSeacovePlayer } from '@/lib/useSeacovePlayer';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function WorkPlayer({ work }) {
  const tracks = [{ src: work.audio_src || undefined, duration: work.duration || 0 }];
  const player = useSeacovePlayer(tracks, { volume: 0.6 });
  if (!work.audio_src && !work.duration) return null;

  return (
    <div style={{ maxWidth: 460, margin: '0 auto 30px' }}>
      <div className="tidebar"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          player.seek((e.clientX - r.left) / r.width);
        }}>
        <div className="trackline" />
        <div className="fill" style={{ width: `${player.progress * 100}%` }} />
        <div className="knob" style={{ left: `${player.progress * 100}%` }} />
      </div>
      <div className="dockrow">
        <button className="pbtn" onClick={player.toggle} aria-label="播放">
          {player.playing
            ? <svg viewBox="0 0 24 24" width="17" height="17" fill="var(--band)"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
            : <svg viewBox="0 0 24 24" width="17" height="17" fill="var(--band)"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <div className="dtime">{fmt(player.currentTime)} / {fmt(player.duration)}</div>
      </div>
    </div>
  );
}
