'use client';
// 海角电台 · 调频盘
// 频段 88.0 – 107.5，每期专访均匀落位为一个频点。
// 拖动滑杆调台：靠近频点即"信号锁定"，节目卡片浮现；空频段是海的杂音。
import { useMemo, useState } from 'react';
import Link from 'next/link';

const BAND_LO = 88.0;
const BAND_HI = 107.5;

export default function RadioTuner({ episodes }) {
  // 均匀分布频点（一期也居中好看）
  const stations = useMemo(() => {
    const n = episodes.length;
    if (!n) return [];
    if (n === 1) return [{ ...episodes[0], freq: 94.7 }];
    return episodes.map((ep, i) => ({
      ...ep,
      freq: Math.round((BAND_LO + 1.5 + (i * (BAND_HI - BAND_LO - 3)) / (n - 1)) * 10) / 10,
    }));
  }, [episodes]);

  const [freq, setFreq] = useState(stations[0]?.freq ?? 94.7);

  // 信号锁定判断：距离最近频点 <= 0.4
  const locked = useMemo(() => {
    let best = null, bestD = Infinity;
    for (const s of stations) {
      const d = Math.abs(s.freq - freq);
      if (d < bestD) { bestD = d; best = s; }
    }
    return bestD <= 0.4 ? best : null;
  }, [freq, stations]);

  const pct = ((freq - BAND_LO) / (BAND_HI - BAND_LO)) * 100;

  return (
    <div className="tuner">
      {/* 刻度带 */}
      <div className="tuner-band">
        <div className="tuner-scale">
          {Array.from({ length: 14 }, (_, i) => 88 + i * 1.5).map((f) => (
            <span key={f} className="tick" style={{ left: `${((f - BAND_LO) / (BAND_HI - BAND_LO)) * 100}%` }}>
              <i />
              <em>{f.toFixed(1)}</em>
            </span>
          ))}
          {stations.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`station${locked?.id === s.id ? ' lit' : ''}`}
              style={{ left: `${((s.freq - BAND_LO) / (BAND_HI - BAND_LO)) * 100}%` }}
              onClick={() => setFreq(s.freq)}
              aria-label={`调到 ${s.freq}`}
            />
          ))}
          {/* 指针 */}
          <span className="needle" style={{ left: `${pct}%` }} />
        </div>
        <input
          className="tuner-slider"
          type="range"
          min={BAND_LO}
          max={BAND_HI}
          step={0.1}
          value={freq}
          onChange={(e) => setFreq(parseFloat(e.target.value))}
          aria-label="调频"
        />
        <div className="tuner-readout">
          <span className="freq">{freq.toFixed(1)}</span>
          <span className="unit">FM</span>
          <span className={`signal${locked ? ' on' : ''}`}>{locked ? '信号锁定' : '沙沙……只有海的声音'}</span>
        </div>
      </div>

      {/* 锁定后的节目 */}
      {locked ? (
        <Link href={`/radio/${locked.id}`} className="program">
          <span className="p-ep">{locked.episode_no ? `第 ${locked.episode_no} 期` : ''}</span>
          <span className="p-title">{locked.title}</span>
          {locked.cove_musicians?.name ? <span className="p-guest">对话 {locked.cove_musicians.name}</span> : null}
          {locked.summary ? <p className="p-sum">{locked.summary}</p> : null}
          <span className="p-enter">收听这段对话 →</span>
        </Link>
      ) : (
        <div className="program static">
          <span className="noise" aria-hidden="true" />
          <p className="p-hint">慢慢拧，别急。总有一个频率里有人在说话。</p>
        </div>
      )}

      {stations.length === 0 && (
        <p className="dredging">电台还没开播，第一位客人在来的路上</p>
      )}
    </div>
  );
}
