'use client';

// 海角唱片行 · 单期沉浸页（客户端）
// 两种视图：沉浸聆听（一首一屏，整屏吸附滚动）/ 本期总览（一屏三首）
// 播放内核：useSeacovePlayer（Howler）；字幕：Narration（结构化，安全）

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSeacovePlayer } from '@/lib/useSeacovePlayer';
import Narration from '@/components/Narration';
import Echoes from '@/components/Echoes';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);
const CNNUM = ['一','二','三','四','五'];
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const IconPlay = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
const IconPause = () => <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>;

export default function RecordShopClient({ issue }) {
  const tracks = issue.tracks;
  const player = useSeacovePlayer(tracks, { volume: 0.55 });
  const [mode, setMode] = useState('immersive'); // immersive | overview
  const reelRef = useRef(null);
  const screenRefs = useRef([]);

  // 滚动切屏：命中新屏则 select（自动停旧曲）
  useEffect(() => {
    if (mode !== 'immersive') return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const i = Number(e.target.dataset.i);
          if (i !== player.active) player.select(i);
        }
      }),
      { root: reelRef.current, threshold: [0.6] }
    );
    screenRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [mode, player]);

  const goto = useCallback((i) => {
    screenRefs.current[i]?.scrollIntoView();
  }, []);

  // 潮线拖动
  const tideRef = useRef(null);
  const onTide = useCallback((clientX) => {
    const r = tideRef.current.getBoundingClientRect();
    player.seek((clientX - r.left) / r.width);
  }, [player]);

  const t = tracks[player.active];

  return (
    <>
      {/* 视图切换 */}
      <div className="modebar">
        <button className={mode === 'immersive' ? 'on' : ''} onClick={() => setMode('immersive')}>沉浸聆听</button>
        <button className={mode === 'overview' ? 'on' : ''} onClick={() => setMode('overview')}>本期总览</button>
      </div>

      {mode === 'immersive' ? (
        <>
          <div className="reel" ref={reelRef}>
            {tracks.map((tr, i) => (
              <section
                key={tr.id || i}
                className="track-screen"
                data-i={i}
                ref={(el) => { screenRefs.current[i] = el; }}
              >
                <div className="composition">
                  <div className="col-left">
                    <div className="stack">
                      <div className="vtitle">{tr.cn}</div>
                      <div className="seal-mark">{tr.seal}</div>
                    </div>
                    <div className="vline" />
                    <div className="meta">{tr.place}</div>
                  </div>

                  <div className="col-center">
                    <div
                      className={'cover' + (player.playing && i === player.active ? ' playing live' : '')}
                      onClick={() => (i === player.active ? player.toggle() : (goto(i), player.play(i)))}
                    >
                      <div className="art" style={tr.cover_url
                        ? { backgroundImage: `url(${tr.cover_url})` }
                        : { background: tr.art }} />
                      {!tr.cover_url && <div className="csun" />}
                      {!tr.cover_url && <div className="csea" style={{ background: tr.sea }} />}
                      <div className="grain" />
                      <button className="playbtn" aria-label="播放">
                        {player.playing && i === player.active ? <IconPause /> : <IconPlay />}
                      </button>
                    </div>
                    <div className="titles">
                      <div className="en">{tr.en}</div>
                      <div className="cn">{tr.cn?.split('').join(' ')}</div>
                      <div className="artist">{tr.artist}</div>
                    </div>
                  </div>

                  <div className="col-right">
                    <div className="ghost">{i + 1}</div>
                    <Narration
                      beats={tr.beats}
                      progress={i === player.active ? player.progress : 0}
                      lead={`第 ${CNNUM[i]} 首 · ${issue.theme_zh}`}
                    />
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="pager">
            {tracks.map((_, i) => (
              <button key={i} className={'dot' + (i === player.active ? ' on' : '')} onClick={() => goto(i)} aria-label={`第${i + 1}首`} />
            ))}
          </div>
        </>
      ) : (
        <div className="overview">
          <div className="sheet-head">
            <div className="no">Seacove No. {roman(issue.issue_number)}</div>
            <div className="th">{issue.theme_zh}</div>
            {issue.intro ? <div className="sub">{issue.intro}</div> : null}
            <div className="hairline" />
          </div>
          <div>
            {tracks.map((tr, i) => (
              <div
                key={tr.id || i}
                className={'orow' + (i === player.active ? ' on' : '')}
                onClick={() => { setMode('immersive'); setTimeout(() => goto(i), 0); }}
              >
                <div className="idx">{i + 1}</div>
                <div className="othumb">
                  <div style={tr.cover_url
                    ? { backgroundImage: `url(${tr.cover_url})` }
                    : { background: tr.art }} />
                </div>
                <div className="oinfo">
                  <div className="en">{tr.en}</div>
                  <div className="cn">{tr.cn?.split('').join(' ')}</div>
                </div>
                <div className="ometa">
                  <div className="who">{tr.artist}{tr.place ? ` · ${tr.place.split(' · ')[0]}` : ''}</div>
                  <button
                    className="oplay"
                    aria-label="播放"
                    onClick={(e) => { e.stopPropagation(); player.play(i); }}
                  >
                    {player.playing && i === player.active ? <IconPause /> : <IconPlay />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Echoes trackId={tracks[player.active]?.id} />
        </div>
      )}

      {/* 播放器坞（两种视图共用） */}
      <div className="dock">
        <div
          className="tidebar"
          ref={tideRef}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onTide(e.clientX); }}
          onPointerMove={(e) => { if (e.buttons === 1) onTide(e.clientX); }}
        >
          <div className="trackline" />
          <div className="fill" style={{ width: `${player.progress * 100}%` }} />
          <div className="knob" style={{ left: `${player.progress * 100}%` }} />
        </div>
        <div className="dockrow">
          <button className="pbtn" onClick={player.toggle} aria-label="播放">
            {player.playing ? <IconPause /> : <IconPlay />}
          </button>
          <div className="dmeta">
            <div className="t">{t?.cn}</div>
            <div className="s">{t?.artist} — 海角第{roman(issue.issue_number)}期</div>
          </div>
          <div className="dtime">{fmt(player.currentTime)} / {fmt(player.duration)}</div>
        </div>
      </div>
    </>
  );
}
