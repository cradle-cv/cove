'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = { episode_no: '', title: '', guest_musician_id: '', host: '海角电台', summary: '', body: '', status: 'draft' };

export default function AdminInterviewsPage() {
  const [list, setList] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [{ data: i }, { data: m }] = await Promise.all([
      supabase.from('cove_interviews').select('*, cove_musicians(name)').order('episode_no', { ascending: false }),
      supabase.from('cove_musicians').select('id, name').eq('status', 'active'),
    ]);
    setList(i || []); setMusicians(m || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setMsg('');
    if (!editing.title) { setMsg('标题必填'); return; }
    const row = {
      episode_no: editing.episode_no ? Number(editing.episode_no) : null,
      title: editing.title, guest_musician_id: editing.guest_musician_id || null,
      host: editing.host || null, summary: editing.summary || null, body: editing.body || null,
      status: editing.status,
      published_at: editing.status === 'published' ? (editing.published_at || new Date().toISOString()) : null,
    };
    const q = editing.id
      ? supabase.from('cove_interviews').update(row).eq('id', editing.id)
      : supabase.from('cove_interviews').insert(row);
    const { error } = await q;
    if (error) { setMsg(error.message); return; }
    setEditing(null); load();
  }

  if (editing) return (
    <div className="cove-form" style={{ maxWidth: 720 }}>
      <label>期号</label>
      <input type="number" value={editing.episode_no || ''} onChange={(e) => setEditing({ ...editing, episode_no: e.target.value })} />
      <label>标题</label>
      <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
      <label>受访音乐人</label>
      <select value={editing.guest_musician_id || ''} onChange={(e) => setEditing({ ...editing, guest_musician_id: e.target.value })}>
        <option value="">（不绑定）</option>
        {musicians.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <label>主持署名</label>
      <input value={editing.host || ''} onChange={(e) => setEditing({ ...editing, host: e.target.value })} />
      <label>一句话引言</label>
      <input value={editing.summary || ''} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} />
      <label>正文（问答体，空行分段）</label>
      <textarea rows={14} value={editing.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
      <label>状态（⚠ 本表用 draft / published）</label>
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

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 14 }}>
        <button className="btn small" onClick={() => setEditing({ ...EMPTY })}>新建专访</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>期号</th><th>标题</th><th>客人</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {list.map((ep) => (
            <tr key={ep.id}>
              <td>{ep.episode_no ? `No. ${ep.episode_no}` : ''}</td>
              <td>{ep.title}</td>
              <td>{ep.cove_musicians?.name || ''}</td>
              <td><span className={'status-pill' + (ep.status === 'published' ? ' pub' : '')}>{ep.status}</span></td>
              <td><button className="btn ghost small" onClick={() => setEditing({ ...ep })}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
