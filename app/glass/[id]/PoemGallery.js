'use client';
// 一组图片，缓慢淡入淡出地轮播。
// 图片经 wsrv.nl 实时压缩到显示尺寸（不追求高清，只求最快显示）。
// 第一张加载完成后通过 onFirstLoad 通知父组件（用来和音乐同步）。
import { useState, useEffect } from 'react';

// 把原图 URL 包成压缩版：宽 720（够 2x 高清屏用），质量 68，输出 webp
function thumb(url, w = 720) {
  if (!url) return url;
  const bare = url.replace(/^https?:\/\//, '');
  return `https://wsrv.nl/?url=${encodeURIComponent(bare)}&w=${w}&q=68&output=webp&we`;
}

export default function PoemGallery({ images = [] }) {
  const [idx, setIdx] = useState(0);
  const list = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [list.length]);

  if (list.length === 0) return null;

  return (
    <div className="poem-gallery">
      <div className="pg-stage">
        {list.map((src, i) => (
          <img
            key={src}
            src={thumb(src)}
            alt=""
            className={'pg-img' + (i === idx ? ' on' : '')}
            loading="eager"
            fetchPriority={i === 0 ? 'high' : 'auto'}
            onError={(e) => { if (e.target.src !== src) e.target.src = src; }}
          />
        ))}
      </div>
      {list.length > 1 ? (
        <div className="pg-dots">
          {list.map((_, i) => (
            <button
              key={i}
              className={'pg-dot' + (i === idx ? ' on' : '')}
              onClick={() => setIdx(i)}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
