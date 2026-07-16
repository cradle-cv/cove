'use client';
// 外链播放器 · 上方音源切换标签 + 下方播放器
// 网易云 → 官方 outchain 横条播放器（站内听全曲）
// Spotify 等 → 只能试听，点标签跳转到该平台
import { useState } from 'react';

function neteaseId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '') !== 'music.163.com') return null;
    let id = u.searchParams.get('id');
    if (!id) { const m = url.match(/[?&#/]id=(\d+)/) || url.match(/song\/(\d+)/); if (m) id = m[1]; }
    return id;
  } catch (e) { return null; }
}

function collectLinks(track) {
  const arr = Array.isArray(track.external_links) ? track.external_links.filter((l) => l && l.url) : [];
  if (arr.length) return arr;
  if (track.external_url) return [{ platform: track.external_platform || '原平台', url: track.external_url }];
  return [];
}

export default function ExternalPlayer({ track }) {
  const links = collectLinks(track);
  // 每条链接标注是否网易云（可站内嵌入）
  const items = links.map((l) => ({ ...l, nid: neteaseId(l.url) }));
  // 默认选中网易云（能听全曲）；没有则第一个
  const firstNet = items.findIndex((l) => l.nid);
  const [active, setActive] = useState(firstNet >= 0 ? firstNet : 0);

  if (!track || items.length === 0) return null;
  const cur = items[active];

  return (
    <div className="ext-strip" onClick={(e) => e.stopPropagation()}>
      {/* 音源切换标签（多于一个才显示） */}
      {items.length > 1 ? (
        <div className="ext-tabs">
          {items.map((l, i) => (
            <button
              key={i}
              className={'ext-tab' + (i === active ? ' on' : '')}
              onClick={() => setActive(i)}
            >
              {l.platform}
            </button>
          ))}
        </div>
      ) : null}

      {cur.nid ? (
        <iframe
          className="ext-netease-frame"
          src={`https://music.163.com/outchain/player?type=2&id=${cur.nid}&auto=1&height=66`}
          frameBorder="no"
          marginWidth="0"
          marginHeight="0"
          width="100%"
          height="86"
          title={track.cn || track.title}
        />
      ) : (
        <a className="ext-jump-card" href={cur.url} target="_blank" rel="noopener noreferrer">
          <span className="ejc-text">在 {cur.platform} 听完整版</span>
          <span className="ejc-arrow">↗</span>
        </a>
      )}
    </div>
  );
}
