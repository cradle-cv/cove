'use client';
// 谱曲台 · AI 氛围配乐生成（调试/创作用）
// 在页面上写提示词、点生成、等一会儿自动出音乐，可试听可下载，有历史记录。
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 几个起手式，点一下填进输入框，再自己改
const PRESETS = [
  {
    name: '极慢极静',
    text: 'solo piano, 40 BPM, extremely sparse, one note every three or four seconds, mostly silence, no melody, cold and static, in the style of Morton Feldman and Erik Satie',
  },
  {
    name: '退潮空滩',
    text: 'sparse minimalist piano, very slow, long silences between single notes, cold and detached, unresolved harmonies, no emotional swells, in the style of late Ryuichi Sakamoto',
  },
  {
    name: '雾中弦乐',
    text: 'distant mournful cello with occasional sparse piano notes, very slow, minor and unresolved, misty and restrained, never rising to a climax, lots of empty space',
  },
  {
    name: '海气氛围',
    text: 'deep ambient drone, warm low synth pads, subtle ocean textures, almost no melody, extremely slow and static, vast and empty, in the style of Brian Eno and William Basinski',
  },
];

export default function ComposePage() {
  const [gate, setGate] = useState('checking'); // checking | ok | nologin | noperm
  const [prompt, setPrompt] = useState(PRESETS[0].text);
  const [jobId, setJobId] = useState('');
  const [status, setStatus] = useState('');      // '' | pending | processing | done | failed
  const [audioUrl, setAudioUrl] = useState('');
  const [err, setErr] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  const loadHistory = async () => {
    try {
      const r = await fetch('/api/minimax-test?list=1');
      const d = await r.json();
      setHistory(Array.isArray(d?.任务列表) ? d.任务列表 : []);
    } catch (e) {}
  };

  // 权限：登录 + 有创作者身份（诗人/词曲）或管理员
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setGate('nologin'); return; }
      const { data: me } = await supabase
        .from('users').select('role, roles').eq('auth_id', session.user.id).maybeSingle();
      const roles = me?.roles || [];
      const allowed = me?.role === 'admin' || roles.includes('poet') || roles.includes('songwriter');
      setGate(allowed ? 'ok' : 'noperm');
      if (allowed) loadHistory();
    })();
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  useEffect(() => stopPolling, []);

  const generate = async () => {
    if (!prompt.trim()) { setErr('先写点提示词'); return; }
    stopPolling();
    setErr(''); setAudioUrl(''); setStatus('pending'); setElapsed(0); setJobId('');

    try {
      const r = await fetch(`/api/minimax-test?p=${encodeURIComponent(prompt.trim())}`);
      const d = await r.json();
      if (!d?.ok || !d?.jobId) { setErr(d?.error || '提交失败'); setStatus('failed'); return; }
      setJobId(d.jobId);
      setStatus('processing');

      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      pollRef.current = setInterval(async () => {
        try {
          const rr = await fetch(`/api/minimax-test?job=${d.jobId}&t=${Date.now()}`);
          const dd = await rr.json();
          if (dd?.status === 'done' && dd?.audioUrl) {
            setAudioUrl(dd.audioUrl); setStatus('done'); stopPolling(); loadHistory();
          } else if (dd?.status === 'failed') {
            setErr(dd?.error || '生成失败'); setStatus('failed'); stopPolling(); loadHistory();
          }
        } catch (e) {}
      }, 5000);
    } catch (e) {
      setErr(String(e)); setStatus('failed');
    }
  };

  const retry = () => { stopPolling(); generate(); };

  if (gate === 'checking') {
    return <main className="compose-wrap"><p className="cp-gate">正在确认身份…</p></main>;
  }
  if (gate === 'nologin') {
    return (
      <main className="compose-wrap">
        <div className="compose-head">
          <div className="ch-en">Compose</div>
          <h1 className="ch-cn">谱 曲 台</h1>
        </div>
        <p className="cp-gate">先靠岸再进来。<Link href="/login">去登录</Link></p>
      </main>
    );
  }
  if (gate === 'noperm') {
    return (
      <main className="compose-wrap">
        <div className="compose-head">
          <div className="ch-en">Compose</div>
          <h1 className="ch-cn">谱 曲 台</h1>
        </div>
        <p className="cp-gate">
          谱曲台开给有创作者身份的人。<Link href="/apply">申请身份</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="compose-wrap">
      <div className="compose-head">
        <div className="ch-en">Compose</div>
        <h1 className="ch-cn">谱 曲 台</h1>
        <p className="ch-sub">写下你想要的声音，让它生成一段氛围配乐。纯器乐，无人声。</p>
      </div>

      <section className="cp-card">
        <label className="cp-label">提示词</label>
        <textarea
          className="cp-textarea"
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的声音。英文通常更准，也可以用中文。"
        />

        <div className="cp-presets">
          {PRESETS.map((p) => (
            <button key={p.name} className="cp-preset" onClick={() => setPrompt(p.text)}>{p.name}</button>
          ))}
        </div>

        <div className="cp-tips">
          要更慢：写具体数字（40 BPM）。要更空：extremely sparse、mostly silence、no melody。
          去掉 AI 抒情味：别用 beautiful/emotional，改用 cold、detached、austere、unresolved。
          举出具体音乐家比形容词有效。
        </div>

        <button
          className="cp-go"
          onClick={generate}
          disabled={status === 'processing' || status === 'pending'}
        >
          {status === 'processing' || status === 'pending' ? '生成中…' : '生成'}
        </button>

        {status === 'processing' && (
          <div className="cp-status">
            <span className="cp-dot" />
            正在生成，通常要 60 到 90 秒（已等 {elapsed} 秒）
            {elapsed > 150 && (
              <div className="cp-slow">
                等太久了，可能这次没跑成。
                <button className="cp-retry" onClick={retry}>重新生成</button>
              </div>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="cp-fail">
            没成功。{err ? <span className="cp-err">{String(err).slice(0, 200)}</span> : null}
            <button className="cp-retry" onClick={retry}>再试一次</button>
          </div>
        )}

        {status === 'done' && audioUrl && (
          <div className="cp-result">
            <audio controls src={audioUrl} className="cp-audio" />
            <div className="cp-actions">
              <a href={audioUrl} target="_blank" rel="noopener noreferrer" download className="cp-dl">下载这段音频</a>
              <button className="cp-again" onClick={retry}>用同样的提示词再生成一版</button>
            </div>
            <p className="cp-note">音频链接有时效，想留下就先下载。</p>
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="cp-history">
          <div className="cph-title">最近生成</div>
          {history.map((h) => (
            <div key={h.id} className="cph-row">
              <span className={'cph-st st-' + h.status}>
                {h.status === 'done' ? '完成' : h.status === 'failed' ? '失败' : '生成中'}
              </span>
              <span className="cph-prompt">{(h.prompt || '（预设）').slice(0, 60)}</span>
              {h.audio_url ? (
                <a className="cph-play" href={h.audio_url} target="_blank" rel="noopener noreferrer">听</a>
              ) : <span className="cph-play dim">—</span>}
            </div>
          ))}
        </section>
      )}

      <div className="cp-back"><Link href="/">← 回海角</Link></div>
    </main>
  );
}
