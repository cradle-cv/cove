'use client';
// 词曲工作台 · 词曲者专属
// 上传词（诗 / 故事作歌词）与曲（音频小样）。
// 词可以送去 AI 生成一版小样（Suno 类服务，服务端代理），生成结果存回作品。
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AudioUploader from '@/components/AudioUploader';

const KIND_CN = { lyric: '词', melody: '曲' };

export default function StudioPage() {
  const [user, setUser] = useState(undefined);
  const [allowed, setAllowed] = useState(false);
  const [works, setWorks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const pollRef = useRef({});

  const load = useCallback(async (uid) => {
    const { data } = await supabase.from('cove_studio_works')
      .select('*').eq('auth_id', uid).order('created_at', { ascending: false });
    setWorks(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (!u) return;
      const { data: prof } = await supabase.from('users')
        .select('roles, role').eq('auth_id', u.id).maybeSingle();
      const ok = (prof?.roles || []).includes('songwriter') || prof?.role === 'admin';
      setAllowed(ok);
      if (ok) load(u.id);
    });
    return () => Object.values(pollRef.current).forEach(clearInterval);
  }, [load]);

  async function save() {
    if (!editing.title?.trim()) { setMsg('标题要有'); return; }
    setMsg('正在保存…');
    const row = {
      auth_id: user.id,
      kind: editing.kind,
      title: editing.title.trim(),
      body: editing.body || null,
      audio_src: editing.audio ? [editing.audio] : (editing.audio_src || null),
    };
    const q = editing.id
      ? supabase.from('cove_studio_works').update(row).eq('id', editing.id)
      : supabase.from('cove_studio_works').insert(row);
    const { error } = await q;
    if (error) { setMsg('保存失败：' + error.message); return; }
    setEditing(null); setMsg(''); load(user.id);
  }

  async function generate(w) {
    if (!w.body?.trim()) { setMsg('这份作品没有词，生成不了'); return; }
    const style = prompt('想要的风格（如：尼龙吉他，安静，民谣）', w.demo_note || '尼龙吉他，安静，民谣');
    if (style === null) return;
    setMsg('正在提交生成任务…');
    const r = await fetch('/api/demo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: w.title, lyrics: w.body, style }),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || '提交失败'); return; }
    await supabase.from('cove_studio_works')
      .update({ demo_task_id: j.taskId, demo_note: style }).eq('id', w.id);
    setMsg('任务已提交，通常一两分钟。做好会自动出现在这条作品下。');
    startPoll(w.id, j.taskId);
    load(user.id);
  }

  function startPoll(workId, taskId) {
    clearInterval(pollRef.current[workId]);
    pollRef.current[workId] = setInterval(async () => {
      const r = await fetch(`/api/demo?taskId=${encodeURIComponent(taskId)}`);
      const j = await r.json();
      if (j.audioUrl) {
        clearInterval(pollRef.current[workId]);
        await supabase.from('cove_studio_works')
          .update({ demo_src: j.audioUrl, status: 'done' }).eq('id', workId);
        setMsg('小样做好了。');
        load(user.id);
      }
      if (j.status && /FAIL|ERROR/i.test(j.status)) {
        clearInterval(pollRef.current[workId]);
        setMsg('生成失败了，可以换个风格再试。');
      }
    }, 9000);
  }

  if (user === undefined) return <main className="sheet"><p className="dredging">正在核对身份</p></main>;

  if (!user || !allowed) {
    return (
      <main className="sheet">
        <div className="sheet-head">
          <div className="no">Studio</div><div className="th">词曲工作台</div>
          <div className="sub">
            这里只对词曲者开放。
            {user ? <>可以先去<Link href="/apply" style={{ margin: '0 4px' }}>申请身份</Link>。</>
                  : <>先<Link href="/login" style={{ margin: '0 4px' }}>靠岸</Link>。</>}
          </div>
          <div className="hairline" />
        </div>
      </main>
    );
  }

  if (editing) {
    return (
      <main className="sheet">
        <div className="sheet-head">
          <div className="no">Studio</div>
          <div className="th">{editing.id ? '编辑' : '新的一份'}</div>
          <div className="hairline" />
        </div>
        <div className="cove-form" style={{ maxWidth: 560, margin: '0 auto' }}>
          <label>类型</label>
          <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
            <option value="lyric">词（诗 / 故事作歌词）</option>
            <option value="melody">曲（音频小样）</option>
          </select>

          <label>标题</label>
          <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

          {editing.kind === 'lyric' ? (
            <>
              <label>正文（保留换行）</label>
              <textarea rows={12} value={editing.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            </>
          ) : (
            <>
              <label>音频（mp3，10MB 以内）</label>
              <AudioUploader
                value={editing.audio || (Array.isArray(editing.audio_src) ? editing.audio_src[0] : '')}
                onDone={({ url }) => setEditing((p) => ({ ...p, audio: url }))}
              />
            </>
          )}

          <div className="form-msg">{msg}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn" onClick={save}>保存</button>
            <button className="btn ghost" onClick={() => { setEditing(null); setMsg(''); }}>取消</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Studio</div>
        <div className="th">词曲工作台</div>
        <div className="sub">词和曲都放在这里。词可以送去 AI 做一版小样，听听它大概长什么样。</div>
        <div className="hairline" />
      </div>

      <div style={{ textAlign: 'right', maxWidth: 640, margin: '0 auto 16px' }}>
        <button className="btn small" onClick={() => setEditing({ kind: 'lyric', title: '', body: '' })}>新的一份</button>
      </div>

      {works.length === 0 ? <p className="dredging">还是空的</p> : null}

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {works.map((w) => (
          <div key={w.id} style={{ border: '1px solid var(--hair)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{KIND_CN[w.kind]}</span>
              <strong style={{ fontSize: 15 }}>{w.title}</strong>
              <span style={{ flex: 1 }} />
              <button className="btn ghost small" onClick={() => setEditing({ ...w })}>编辑</button>
              {w.kind === 'lyric' ? (
                <button className="btn small" onClick={() => generate(w)}>
                  {w.demo_src ? '重新生成小样' : 'AI 生成小样'}
                </button>
              ) : null}
            </div>
            {w.body ? (
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.9,
                whiteSpace: 'pre-wrap', maxHeight: 96, overflow: 'hidden' }}>{w.body}</p>
            ) : null}
            {Array.isArray(w.audio_src) && w.audio_src[0] ? (
              <audio controls preload="none" src={w.audio_src[0]} style={{ width: '100%', marginTop: 10 }} />
            ) : null}
            {w.demo_src ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', color: 'var(--ink-soft)', marginBottom: 6 }}>
                  AI 小样{w.demo_note ? ` · ${w.demo_note}` : ''}
                </div>
                <audio controls preload="none" src={w.demo_src} style={{ width: '100%' }} />
              </div>
            ) : w.demo_task_id ? (
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>小样在做了，一两分钟后刷新看看。</p>
            ) : null}
          </div>
        ))}
      </div>
      <div className="form-msg" style={{ textAlign: 'center' }}>{msg}</div>
    </main>
  );
}
