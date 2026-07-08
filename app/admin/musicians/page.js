'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = { name: '', name_en: '', origin: '', bio: '', portrait_url: '', status: 'active' };

export default function AdminMusiciansPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('cove_musicians').select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setMsg('');
    if (!editing.name) { setMsg('名字必填'); return; }
    const row = { name: editing.name, name_en: editing.name_en || null, origin: editing.origin || null,
      bio: editing.bio || null, portrait_url: editing.portrait_url || null, status: editing.status };
    const q = editing.id
      ? supabase.from('cove_musicians').update(row).eq('id', editing.id)
      : supabase.from('cove_musicians').insert(row);
    const { error } = await q;
    if (error) { setMsg(error.message); return; }
    setEditing(null); load();
  }

  if (editing) return (
    <div className="cove-form">
      <label>名字</label>
      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
      <label>英文名</label>
      <input value={editing.name_en || ''} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} />
      <label>来处</label>
      <input value={editing.origin || ''} onChange={(e) => setEditing({ ...editing, origin: e.target.value })} />
      <label>简介</label>
      <textarea value={editing.bio || ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
      <label>肖像 URL（R2）</label>
      <input value={editing.portrait_url || ''} onChange={(e) => setEditing({ ...editing, portrait_url: e.target.value })} />
      <label>状态（⚠ 本表用 active / hidden，不是 published）</label>
      <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
        <option value="active">active</option><option value="hidden">hidden</option>
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
        <button className="btn small" onClick={() => setEditing({ ...EMPTY })}>新建音乐人</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>名字</th><th>来处</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id}>
              <td>{m.name}<em style={{ color: 'var(--ink-soft)', marginLeft: 8 }}>{m.name_en}</em></td>
              <td>{m.origin || ''}</td>
              <td><span className={'status-pill' + (m.status === 'active' ? ' pub' : '')}>{m.status}</span></td>
              <td><button className="btn ghost small" onClick={() => setEditing({ ...m })}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
