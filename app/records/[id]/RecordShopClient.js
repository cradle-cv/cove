'use client';

// 打捞碎月 · 单期沉浸页（客户端）
// 两种视图：沉浸聆听（一首一屏，整屏吸附滚动）/ 本期总览（一屏三首）
// 播放内核：useSeacovePlayer（Howler）；字幕：Narration（结构化，安全）

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSeacovePlayer } from '@/lib/useSeacovePlayer';
import Narration from '@/components/Narration';
import Lyrics from '@/components/Lyrics';
import Echoes from '@/components/Echoes';
import Waveform from '@/components/Waveform';
import { activeBeatIndex } from '@/lib/beats';
import { useSeaSound } from '@/lib/useSeaSound';
import ExternalPlayer from './ExternalPlayer';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);
const CNNUM = ['一','二','三','四','五'];
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const IconPlay = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>;
const IconPause = () => <svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>;
const IconWave = ({ on }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 12q3-3 5.5 0T13 12t5.5 0T22 12" />
    {on ? <path d="M2 17q3-3 5.5 0T13 17t5.5 0T22 17" opacity=".55" /> : null}
    {on ? <path d="M4 7q2.5-2.4 4.5 0T13 7t4.5 0T20 7" opacity=".3" /> : null}
  </svg>
);

export default function RecordShopClient({ issue }) {
  const tracks = issue.tracks;
  const player = useSeacovePlayer(tracks, { volume: 0.55 });
  const [mode, setMode] = useState('immersive'); // immersive | overview
  // 涨潮字幕当前段：默认随潮水推进；鼠标移到浮标上时，临时浮起那一段
  const [hoverBeat, setHoverBeat] = useState(-1);
  const [extTrack, setExtTrack] = useState(null); // 正在外链播放的曲目（弹窗）

  // 统一的"播放某首"：有站内音频→正常播；只有外链→弹窗 + 让字幕按时长涨潮
  const playTrack = (i) => {
    const tk = tracks[i];
    const hasSrc = Array.isArray(tk?.src) && tk.src.length > 0;
    const hasExt = (Array.isArray(tk?.external_links) && tk.external_links.length) || tk?.external_url;
    if (!hasSrc && hasExt) {
      if (i !== player.active) player.select(i);
      player.play(i);            // 无 src 时内核按 duration 走计时，字幕照常涨潮
      setExtTrack(tk);           // 弹出外链小窗
      return;
    }
    player.play(i);
  };
  const toggleTrack = () => {
    const tk = tracks[player.active];
    const hasSrc = Array.isArray(tk?.src) && tk.src.length > 0;
    const hasExt = (Array.isArray(tk?.external_links) && tk.external_links.length) || tk?.external_url;
    if (!hasSrc && hasExt) {
      player.toggle();
      if (!player.playing) setExtTrack(tk);
      return;
    }
    player.toggle();
  };

  // 海声：只在没有音频的曲目上响。真音频进来了，海自己退场。
  const cur = tracks[player.active];
  const sea = useSeaSound(cur, {
    hasAudio: Array.isArray(cur?.src) && cur.src.length > 0,
    volume: 0.42,
  });
  const reelRef = useRef(null);
  const screenRefs = useRef([]);

  // 当前段：鼠标悬在某个浮标上就显示那一段，否则跟着歌走。
  // 悬停只是探头看一眼，歌照常唱，进度不动。
  const beatIndexFor = useCallback((i) => {
    const beats = tracks[i]?.beats || [];
    if (!beats.length) return -1;
    if (i === player.active && hoverBeat >= 0) return hoverBeat;
    const prog = i === player.active ? player.progress : 0;
    return prog > 0.001 ? activeBeatIndex(beats, prog) : -1;
  }, [tracks, player.active, player.progress, hoverBeat]);

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
                    <Lyrics
                      lines={tr.lyrics}
                      progress={i === player.active ? player.progress : 0}
                    />
                    <div className="place-mark">{tr.place}</div>
                  </div>

                  <div className="col-center">
                    {extTrack && extTrack.id === tr.id ? (
                      <ExternalPlayer track={tr} onClose={() => setExtTrack(null)} />
                    ) : null}
                    <div
                      className={'cover' + (player.playing && i === player.active ? ' playing live' : '')}
                      onClick={() => (i === player.active ? toggleTrack() : (goto(i), playTrack(i)))}
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
                      index={beatIndexFor(i)}
                      lead={`第 ${CNNUM[i]} 首 · ${issue.theme_zh}`}
                      peeking={i === player.active && hoverBeat >= 0}
                      hint="海面上浮着几个点。等潮水漫过去，或者把手停在上面。"
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
                  <div className="who">{tr.artist}</div>
                  {extTrack && extTrack.id === tr.id ? (
                    <div className="orow-ext">
                      <ExternalPlayer track={tr} onClose={() => setExtTrack(null)} />
                    </div>
                  ) : null}
                  <button
                    className="oplay"
                    aria-label="播放"
                    onClick={(e) => { e.stopPropagation(); playTrack(i); }}
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
        <div className="tidewave">
          <Waveform
            peaks={t?.waveform}
            duration={player.duration}
            progress={player.progress}
            beats={t?.beats || []}
            activeBeat={beatIndexFor(player.active)}
            onSeek={(r) => player.seek(r)}
            onHoverBeat={setHoverBeat}
          />
        </div>
        <div className="dockrow">
          <button className="pbtn" onClick={toggleTrack} aria-label="播放">
            {player.playing ? <IconPause /> : <IconPlay />}
          </button>
          {sea.available ? (
            <button
              className={'seabtn' + (sea.on ? ' on' : '')}
              onClick={sea.toggle}
              title={sea.on ? '收起这片海' : '听听这片海'}
              aria-label={sea.on ? '收起海声' : '播放海声'}
              aria-pressed={sea.on}
            >
              <IconWave on={sea.on} />
            </button>
          ) : null}
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
