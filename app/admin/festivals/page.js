'use client';

// 管理端 · 音乐节：制作人建邀请函 + 审阅报名
// Rule B：截稿锁只对报名者编辑生效；制作人的审阅（accept/decline）不受截稿限制。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';

const EMPTY = { title: '', venue: '', show_date: '', brief: '', roles_text: '', deadline: '', status: 'draft', invite_type: 'gig_call', organizer_role: 'producer' };
const TYPE_OPTS = [['gig_call','演出征人'],['band_recruit','乐团招募'],['venue_offer','场地承接']];
const ROLE_OPTS = [['singer','歌手'],['instrumentalist','乐手'],['producer','制作人'],['bar','酒吧'],['music_company','音乐公司'],['promoter','演出机构']];

export default function AdminFestivalsPage() {
  const { profile } = useUser();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [viewingSubs, setViewingSubs] = useState(null); // festival
  const [subs, setSubs] = useState([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('cove_festivals').select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openEdit(f) {
    setMsg('');
    if (!f) { setEditing({ ...EMPTY }); return; }
    setEditing({
      ...f,
      show_date: f.show_date || '',
      invite_type: f.invite_type || 'gig_call', organizer_role: f.organizer_role || 'producer',
      deadline: f.deadline ? f.deadline.slice(0, 16) : '',
      roles_text: (f.roles_needed || []).map((r) => `${r.role} ${r.count}`).join('\n'),
    });
  }

  async function save() {
    setMsg('');
    if (!editing.title) { setMsg('演出名必填'); return; }
    const roles = editing.roles_text.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/^(.+?)\s+(\d+)$/);
      return m ? { role: m[1], count: Number(m[2]) } : { role: l, count: 1 };
    });
    const row = {
      title: editing.title, venue: editing.venue || null,
      show_date: editing.show_date || null, brief: editing.brief || null,
      roles_needed: roles, deadline: editing.deadline ? new Date(editing.deadline).toISOString() : null,
      invite_type: editing.invite_type || 'gig_call', organizer_role: editing.organizer_role || null,
      status: editing.status,
      ...(editing.id ? {} : { producer_id: profile?.id }),
    };
    const q = editing.id
      ? supabase.from('cove_festivals').update(row).eq('id', editing.id)
      : supabase.from('cove_festivals').insert(row);
    const { error } = await q;
    if (error) { setMsg(error.message); return; }
    setEditing(null); load();
  }

  async function openSubs(f) {
    setViewingSubs(f);
    const { data } = await supabase
      .from('cove_festival_submissions')
      .select('*, users(username, email)')
      .eq('festival_id', f.id).order('created_at');
    setSubs(data || []);
  }
  async function review(id, review_status) {
    await supabase.from('cove_festival_submissions').update({ review_status }).eq('id', id);
    openSubs(viewingSubs);
  }

  if (viewingSubs) return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="btn ghost small" onClick={() => setViewingSubs(null)}>← 返回</button>
        <span style={{ marginLeft: 12, fontWeight: 600 }}>{viewingSubs.title} · 报名审阅</span>
      </div>
      <table className="admin-table">
        <thead><tr><th>报名人</th><th>角色</th><th>自荐</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id}>
              <td>{s.users?.username || s.users?.email || ''}</td>
              <td>{s.role}</td>
              <td style={{ maxWidth: 320 }}>{s.message || ''}</td>
              <td><span className={'status-pill' + (s.review_status === 'accepted' ? ' pub' : '')}>{s.review_status}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn ghost small" onClick={() => review(s.id, 'accepted')}>收</button>
                <button className="btn ghost small" onClick={() => review(s.id, 'declined')} style={{ marginLeft: 6 }}>谢</button>
              </td>
            </tr>
          ))}
          {subs.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>还没有报名</td></tr> : null}
        </tbody>
      </table>
    </div>
  );

  if (editing) return (
    <div className="cove-form" style={{ maxWidth: 720 }}>
      <label>演出名</label>
      <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
      <label>场地</label>
      <input value={editing.venue || ''} onChange={(e) => setEditing({ ...editing, venue: e.target.value })} />
      <label>邀请函类型</label>
      <select value={editing.invite_type || 'gig_call'} onChange={(e) => setEditing({ ...editing, invite_type: e.target.value })}>
        {TYPE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label>发起方身份</label>
      <select value={editing.organizer_role || 'producer'} onChange={(e) => setEditing({ ...editing, organizer_role: e.target.value })}>
        {ROLE_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <label>演出日期</label>
      <input type="date" value={editing.show_date || ''} onChange={(e) => setEditing({ ...editing, show_date: e.target.value })} />
      <label>邀请函正文</label>
      <textarea value={editing.brief || ''} onChange={(e) => setEditing({ ...editing, brief: e.target.value })} />
      <label>召集名录（每行：角色 空格 人数，如 "吉他手 1"）</label>
      <textarea rows={4} value={editing.roles_text} onChange={(e) => setEditing({ ...editing, roles_text: e.target.value })} />
      <label>报名截稿（Rule B：截稿前报名可改，截稿即锁）</label>
      <input type="datetime-local" value={editing.deadline || ''} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} />
      <label>状态（⚠ 本表用 draft / open / locked / completed）</label>
      <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
        <option value="draft">draft</option><option value="open">open</option>
        <option value="locked">locked</option><option value="completed">completed</option>
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
        <button className="btn small" onClick={() => openEdit(null)}>发新邀请函</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>演出</th><th>日期</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {list.map((f) => (
            <tr key={f.id}>
              <td>{f.title}</td>
              <td>{f.show_date || ''}</td>
              <td><span className={'status-pill' + (f.status === 'open' ? ' open' : f.status === 'completed' ? ' pub' : '')}>{f.status}</span></td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="btn ghost small" onClick={() => openEdit(f)}>编辑</button>
                <button className="btn ghost small" onClick={() => openSubs(f)} style={{ marginLeft: 6 }}>报名</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
