'use client';

// 管理端 · 唱片行排期（同构摇篮 admin/curations 的建期流程）
// 建期 → 从歌曲中按序挑选 → 发布。track_ids 的顺序即沉浸页的顺序。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = { issue_number: '', theme_zh: '', theme_en: '', intro: '', is_special: false, status: 'draft' };

export default function AdminCurationsPage() {
  const [issues, setIssues] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [picked, setPicked] = useState([]);   // 有序 track id 数组
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('cove_curations').select('*').order('issue_number', { ascending: false }),
      supabase.from('cove_tracks').select('id, title, title_en, status').order('created_at', { ascending: false }),
    ]);
    setIssues(c || []); setTracks(t || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openEdit(c) {
    setMsg('');
    if (!c) { setEditing({ ...EMPTY }); setPicked([]); return; }
    setEditing({ ...c }); setPicked(c.track_ids || []);
  }

  function togglePick(id) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  function move(id, dir) {
    setPicked((p) => {
      const i = p.indexOf(id); if (i < 0) return p;
      const j = i + dir; if (j < 0 || j >= p.length) return p;
      const n = [...p]; [n[i], n[j]] = [n[j], n[i]]; return n;
    });
  }

  async function save() {
    setMsg('');
    if (!editing.issue_number || !editing.theme_zh) { setMsg('期号和中文主题必填'); return; }
    if (picked.length === 0) { setMsg('至少选一首歌'); return; }
    const row = {
      issue_number: Number(editing.issue_number),
      theme_zh: editing.theme_zh, theme_en: editing.theme_en || null,
      intro: editing.intro || null, is_special: !!editing.is_special,
      track_ids: picked, status: editing.status,
      published_at: editing.status === 'published' ? (editing.published_at || new Date().toISOString()) : null,
    };
    const q = editing.id
      ? supabase.from('cove_curations').update(row).eq('id', editing.id)
      : supabase.from('cove_curations').insert(row);
    const { error } = await q;
    if (error) { setMsg(error.message); return; }
    setEditing(null); load();
  }

  if (editing) {
    const pickedTracks = picked.map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    const rest = tracks.filter((t) => !picked.includes(t.id));
    return (
      <div className="cove-form" style={{ maxWidth: 720 }}>
        <label>期号（数字，前台显示为罗马数字）</label>
        <input type="number" value={editing.issue_number} onChange={(e) => setEditing({ ...editing, issue_number: e.target.value })} />
        <label>中文主题</label>
        <input value={editing.theme_zh} onChange={(e) => setEditing({ ...editing, theme_zh: e.target.value })} />
        <label>英文主题</label>
        <input value={editing.theme_en || ''} onChange={(e) => setEditing({ ...editing, theme_en: e.target.value })} />
        <label>期引言</label>
        <textarea value={editing.intro || ''} onChange={(e) => setEditing({ ...editing, intro: e.target.value })} />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={!!editing.is_special}
            onChange={(e) => setEditing({ ...editing, is_special: e.target.checked })} /> 特刊
        </label>

        <label>本期曲目（点击选入/移出；↑↓ 调整顺序，顺序即页面顺序）</label>
        <div>
          {pickedTracks.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--hair)' }}>
              <span style={{ fontStyle: 'italic', color: 'var(--seaglass)', width: 20 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{t.title} <em style={{ color: 'var(--ink-soft)' }}>{t.title_en}</em>
                {t.status !== 'published' ? <span className="status-pill" style={{ marginLeft: 8 }}>draft</span> : null}</span>
              <button className="btn ghost small" onClick={() => move(t.id, -1)}>↑</button>
              <button className="btn ghost small" onClick={() => move(t.id, 1)}>↓</button>
              <button className="btn ghost small" onClick={() => togglePick(t.id)}>移出</button>
            </div>
          ))}
          {rest.map((t) => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', opacity: 0.7 }}>
              <span style={{ flex: 1 }}>{t.title} <em style={{ color: 'var(--ink-soft)' }}>{t.title_en}</em></span>
              <button className="btn ghost small" onClick={() => togglePick(t.id)}>选入</button>
            </div>
          ))}
        </div>

        <label>状态（⚠ 本表用 draft / published；发布的期会点亮灯塔）</label>
        <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
          <option value="draft">draft</option><option value="published">published</option>
        </select>
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
        <button className="btn small" onClick={() => openEdit(null)}>建新一期</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>期号</th><th>主题</th><th>曲目数</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {issues.map((c) => (
            <tr key={c.id}>
              <td>No. {c.issue_number}{c.is_special ? '（特刊）' : ''}</td>
              <td>{c.theme_zh}<em style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>{c.theme_en}</em></td>
              <td>{c.track_ids?.length || 0}</td>
              <td><span className={'status-pill' + (c.status === 'published' ? ' pub' : '')}>{c.status}</span></td>
              <td><button className="btn ghost small" onClick={() => openEdit(c)}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
