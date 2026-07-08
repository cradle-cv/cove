'use client';

// 管理端 · 歌曲与字幕
// 字幕录入格式：每行一句 —— "时机 空格 文字"，文字里用【】包住强调段。
//   0.58 老人听完只说，这调子【像涨潮】。后来这三个字成了歌名。
// 保存时解析为结构化 segments（{"t":..}/{"t":..,"em":true}），整表替换该曲的 cove_beats。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// 【】→ segments
export function parseBeatLine(line) {
  const m = line.trim().match(/^([0-9.]+)\s+(.+)$/);
  if (!m) return null;
  const at = parseFloat(m[1]);
  if (Number.isNaN(at) || at < 0 || at > 1) return null;
  const segments = [];
  m[2].split(/(【[^】]*】)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('【') && part.endsWith('】')) {
      const t = part.slice(1, -1);
      if (t) segments.push({ t, em: true });
    } else segments.push({ t: part });
  });
  return segments.length ? { at, segments } : null;
}

// segments → 行
export function beatToLine(b) {
  const text = (b.segments || []).map((s) => (s.em ? `【${s.t}】` : s.t)).join('');
  return `${Number(b.at)} ${text}`;
}

const EMPTY = {
  title: '', title_en: '', place: '', seal: '', duration: 200,
  musician_id: '', art: '', sea: '', cover_url: '', status: 'draft',
};

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [editing, setEditing] = useState(null);   // null | {id?, ...fields}
  const [beatsText, setBeatsText] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('cove_tracks').select('*, cove_musicians(name)').order('created_at', { ascending: false }),
      supabase.from('cove_musicians').select('id, name').eq('status', 'active'),
    ]);
    setTracks(t || []); setMusicians(m || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openEdit(t) {
    setMsg('');
    if (!t) { setEditing({ ...EMPTY }); setBeatsText(''); return; }
    setEditing({ ...t });
    const { data: beats } = await supabase
      .from('cove_beats').select('*').eq('track_id', t.id).order('ord');
    setBeatsText((beats || []).map(beatToLine).join('\n'));
  }

  async function save() {
    setMsg('');
    const parsed = beatsText.split('\n').map((l) => l.trim()).filter(Boolean).map(parseBeatLine);
    if (parsed.some((p) => !p)) { setMsg('字幕有格式错误的行：应为 "0.58 文字…"，时机 0 到 1'); return; }

    const row = {
      title: editing.title, title_en: editing.title_en, place: editing.place,
      seal: editing.seal, duration: Number(editing.duration) || null,
      musician_id: editing.musician_id || null,
      art: editing.art || null, sea: editing.sea || null,
      cover_url: editing.cover_url || null, status: editing.status,
    };
    let trackId = editing.id;
    if (trackId) {
      const { error } = await supabase.from('cove_tracks').update(row).eq('id', trackId);
      if (error) { setMsg(error.message); return; }
    } else {
      const { data, error } = await supabase.from('cove_tracks').insert(row).select('id').single();
      if (error) { setMsg(error.message); return; }
      trackId = data.id;
    }

    // 字幕整表替换
    await supabase.from('cove_beats').delete().eq('track_id', trackId);
    if (parsed.length) {
      const { error: be } = await supabase.from('cove_beats').insert(
        parsed.map((b, i) => ({ track_id: trackId, ord: i + 1, at: b.at, segments: b.segments }))
      );
      if (be) { setMsg(be.message); return; }
    }
    setEditing(null); setBeatsText(''); load();
  }

  if (editing) {
    return (
      <div className="cove-form">
        <label>歌名</label>
        <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        <label>英文名</label>
        <input value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} />
        <label>音乐人</label>
        <select value={editing.musician_id || ''} onChange={(e) => setEditing({ ...editing, musician_id: e.target.value })}>
          <option value="">（未指定）</option>
          {musicians.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <label>来处（如 东山岛 · 1986）</label>
        <input value={editing.place || ''} onChange={(e) => setEditing({ ...editing, place: e.target.value })} />
        <label>印章单字</label>
        <input value={editing.seal || ''} maxLength={1} onChange={(e) => setEditing({ ...editing, seal: e.target.value })} />
        <label>时长（秒）</label>
        <input type="number" value={editing.duration || ''} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
        <label>封面渐变 art（或填下方封面图 URL）</label>
        <input value={editing.art || ''} onChange={(e) => setEditing({ ...editing, art: e.target.value })} placeholder="linear-gradient(180deg,…)" />
        <label>海面渐变 sea</label>
        <input value={editing.sea || ''} onChange={(e) => setEditing({ ...editing, sea: e.target.value })} />
        <label>封面图 URL（R2，可选，优先于渐变）</label>
        <input value={editing.cover_url || ''} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} />
        <label>状态（⚠ 本表用 draft / published）</label>
        <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
          <option value="draft">draft</option><option value="published">published</option>
        </select>
        <label>涨潮字幕（每行：时机 空格 文字，【】包强调段）</label>
        <textarea rows={10} value={beatsText} onChange={(e) => setBeatsText(e.target.value)}
          placeholder={'0 一九八六年的夏天，他在东山岛的渡口，等一班始终没有来的船。\n0.58 老人听完只说，这调子【像涨潮】。后来这三个字成了歌名。'} />
        <div className="form-msg">{msg}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={save}>保存</button>
          <button className="btn ghost" onClick={() => setEditing(null)}>取消</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 14 }}>
        <button className="btn small" onClick={() => openEdit(null)}>新建歌曲</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>歌名</th><th>音乐人</th><th>来处</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {tracks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}<span style={{ color: 'var(--ink-soft)', marginLeft: 8, fontStyle: 'italic' }}>{t.title_en}</span></td>
              <td>{t.cove_musicians?.name || ''}</td>
              <td>{t.place || ''}</td>
              <td><span className={'status-pill' + (t.status === 'published' ? ' pub' : '')}>{t.status}</span></td>
              <td><button className="btn ghost small" onClick={() => openEdit(t)}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
