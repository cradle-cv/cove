'use client';
// 一组图片，缓慢淡入淡出地轮播。和诗分区，单独一栏。
import { useState, useEffect } from 'react';

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
            src={src}
            alt=""
            className={'pg-img' + (i === idx ? ' on' : '')}
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
