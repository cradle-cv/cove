'use client';
// 外链播放器 · 就是一条扁扁的网易云原生播放器，放在封面左边
// 网易云 → 官方 outchain 横条播放器（能听全曲）
// 其他能嵌的（YouTube/Spotify）→ 若网易云不存在才显示；Spotify 只能试听，做成文字跳转


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
  if (!track || links.length === 0) return null;

  // 优先网易云（能听全曲）
  const netease = links.map((l) => ({ ...l, nid: neteaseId(l.url) })).find((l) => l.nid);
  // 其他平台（Spotify 等）做成下方的小跳转
  const others = links.filter((l) => !neteaseId(l.url));

  return (
    <div className="ext-strip" onClick={(e) => e.stopPropagation()}>

      {netease ? (
        <iframe
          className="ext-netease-frame"
          src={`https://music.163.com/outchain/player?type=2&id=${netease.nid}&auto=1&height=66`}
          frameBorder="no"
          marginWidth="0"
          marginHeight="0"
          width="100%"
          height="86"
          title={track.cn || track.title}
        />
      ) : null}

      {others.length ? (
        <div className="ext-others">
          {others.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="ext-other-link">
              {l.platform} ↗
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
