'use client';
// 外链小窗 · 站内浮层（支持一首歌配多个平台）
// 能官方嵌入的平台（YouTube / Spotify / SoundCloud）→ 站内直接播（默认展开第一个可嵌入的）
// 国内平台（网易云 / QQ音乐）→ 一个「去平台听」按钮，新标签打开
// 一首歌可同时有 Spotify 嵌入 + 网易云跳转，境内外读者各取所需。
// 无论哪种，外面的字幕都照常按预估时长涨潮。
import { useEffect, useState } from 'react';

// 把链接转成可嵌入地址；不支持嵌入的返回 null
function toEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    }
    if (host === 'soundcloud.com') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`;
    }
    // 网易云音乐：用官方 outchain 播放器嵌入
    if (host === 'music.163.com') {
      // 从链接里提取歌曲 id（song?id=xxx 或 #/song?id=xxx 或 outchain/player?...id=xxx）
      let id = u.searchParams.get('id');
      if (!id) {
        const m = url.match(/[?&#/]id=(\d+)/) || url.match(/song\/(\d+)/);
        if (m) id = m[1];
      }
      if (id) return { netease: `https://music.163.com/outchain/player?type=2&id=${id}&auto=1&height=66` };
    }
  } catch (e) {}
  return null;
}

// 兼容旧的单字段：把 track 上的外链整理成统一的 links 数组
function collectLinks(track) {
  const arr = Array.isArray(track.external_links) ? track.external_links.filter((l) => l && l.url) : [];
  if (arr.length) return arr;
  if (track.external_url) return [{ platform: track.external_platform || '原平台', url: track.external_url }];
  return [];
}

export default function ExternalPlayer({ track, onClose }) {
  const links = collectLinks(track);
  // 每条链接算出是否可嵌入
  const items = links.map((l) => ({ ...l, embed: toEmbed(l.url) }));
  // 默认选中第一个「可嵌入」的；没有可嵌入的就选第一个
  const firstEmbeddable = items.findIndex((it) => it.embed);
  const [active, setActive] = useState(firstEmbeddable >= 0 ? firstEmbeddable : 0);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!track || items.length === 0) return null;
  const cur = items[active];

  return (
    <div className="ext-overlay">
      <div className="ext-window" onClick={(e) => e.stopPropagation()}>
        <button className="ext-close" onClick={onClose} aria-label="关闭">×</button>

        {/* 多平台切换（多于一个才显示） */}
        {items.length > 1 ? (
          <div className="ext-tabs">
            {items.map((it, i) => (
              <button
                key={i}
                className={'ext-tab' + (i === active ? ' on' : '')}
                onClick={() => setActive(i)}
              >
                {it.platform}
              </button>
            ))}
          </div>
        ) : null}

        {typeof cur.embed === 'string' ? (
          <div className={'ext-embed' + (cur.url.includes('spotify') ? ' spotify' : '')}>
            <iframe
              src={cur.embed}
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="eager"
              title={track.cn || track.title}
            />
          </div>
        ) : cur.embed && cur.embed.netease ? (
          <div className="ext-netease">
            <iframe
              src={cur.embed.netease}
              frameBorder="no"
              marginWidth="0"
              marginHeight="0"
              width="100%"
              height="86"
              title={track.cn || track.title}
            />
          </div>
        ) : (
          <div className="ext-jump">
            <p className="ext-note">
              在{cur.platform}听完整版。<br />海角会留在这里等你回来。
            </p>
            <a className="ext-go" href={cur.url} target="_blank" rel="noopener noreferrer">
              去{cur.platform}听 →
            </a>
            <p className="ext-hint">字幕会在这边继续，按歌的长度慢慢浮起来。</p>
          </div>
        )}
      </div>
    </div>
  );
}
