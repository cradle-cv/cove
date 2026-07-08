'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const EMPTY = { name: '', kind: '', city: '', intro: '', link_url: '', status: 'active' };

export default function AdminPartnersPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('cove_partners').select('*').order('created_at');
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    setMsg('');
    if (!editing.name) { setMsg('名字必填'); return; }
    const row = { name: editing.name, kind: editing.kind || null, city: editing.city || null,
      intro: editing.intro || null, link_url: editing.link_url || null, status: editing.status };
    const q = editing.id
      ? supabase.from('cove_partners').update(row).eq('id', editing.id)
      : supabase.from('cove_partners').insert(row);
    const { error } = await q;
    if (error) { setMsg(error.message); return; }
    setEditing(null); load();
  }

  if (editing) return (
    <div className="cove-form">
      <label>名字</label>
      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
      <label>类型（label / record_shop / livehouse / media）</label>
      <input value={editing.kind || ''} onChange={(e) => setEditing({ ...editing, kind: e.target.value })} />
      <label>城市</label>
      <input value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />
      <label>介绍</label>
      <textarea value={editing.intro || ''} onChange={(e) => setEditing({ ...editing, intro: e.target.value })} />
      <label>链接</label>
      <input value={editing.link_url || ''} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} />
      <label>状态（⚠ 本表用 active / hidden）</label>
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
        <button className="btn small" onClick={() => setEditing({ ...EMPTY })}>新增邻港</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>名字</th><th>类型</th><th>城市</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td><td>{p.kind || ''}</td><td>{p.city || ''}</td>
              <td><span className={'status-pill' + (p.status === 'active' ? ' pub' : '')}>{p.status}</span></td>
              <td><button className="btn ghost small" onClick={() => setEditing({ ...p })}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
