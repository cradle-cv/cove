'use client';
// 外链小窗 · 站内浮层
// 名曲没有站内音频，点击时弹出这个小窗。
//   能官方嵌入的平台（YouTube / Spotify / SoundCloud / Bandcamp）→ 直接嵌播放器，站内真播
//   国内平台（网易云 / QQ音乐）→ 放封面+一个「去平台听」按钮，新标签打开
// 无论哪种，外面的字幕都照常按预估时长涨潮。
import { useEffect } from 'react';

// 把常见平台链接转成可嵌入的 embed 地址；不支持嵌入的返回 null
function toEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    // YouTube
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return { type: 'iframe', src: `https://www.youtube.com/embed/${v}?autoplay=1` };
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1` };
    }
    // Spotify
    if (host === 'open.spotify.com') {
      return { type: 'iframe', src: `https://open.spotify.com/embed${u.pathname}` };
    }
    // SoundCloud
    if (host === 'soundcloud.com') {
      return { type: 'iframe', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true` };
    }
    // Bandcamp（EmbeddedPlayer 需要专辑/曲目 id，无法从普通链接直接推导，走跳转）
  } catch (e) {}
  return null;
}

export default function ExternalPlayer({ track, onClose }) {
  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!track) return null;
  const embed = toEmbed(track.external_url);
  const platform = track.external_platform || '原平台';

  return (
    <div className="ext-overlay" onClick={onClose}>
      <div className="ext-window" onClick={(e) => e.stopPropagation()}>
        <button className="ext-close" onClick={onClose} aria-label="关闭">×</button>

        <div className="ext-title">{track.cn || track.title}</div>
        <div className="ext-sub">{track.artist || track.en}</div>

        {embed ? (
          <div className="ext-embed">
            <iframe
              src={embed.src}
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="eager"
              title={track.cn || track.title}
            />
          </div>
        ) : (
          <div className="ext-jump">
            <p className="ext-note">
              这首歌收在{platform}。<br />
              点开在{platform}听，海角会留在这里等你回来。
            </p>
            <a className="ext-go" href={track.external_url} target="_blank" rel="noopener noreferrer">
              去{platform}听 →
            </a>
            <p className="ext-hint">字幕会在这边继续，按歌的长度慢慢浮起来。</p>
          </div>
        )}
      </div>
    </div>
  );
}
