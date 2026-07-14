'use client';

// 管理端 · 用户管理
// 列出所有注册用户，可增减业务身份（词曲者/歌手乐手/制作人/音乐机构），可设/撤管理员。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const ROLES = [
  ['songwriter', '词曲者'],
  ['performer', '歌手/乐手'],
  ['producer', '制作人'],
  ['organization', '音乐机构'],
];

export default function AdminUsersPage() {
  const [list, setList] = useState([]);
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('users')
      .select('id, auth_id, email, username, handle, role, roles, created_at')
      .order('created_at', { ascending: false });
    setList(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user?.id || null));
    load();
  }, [load]);

  async function toggleRole(u, role) {
    setMsg('');
    const has = (u.roles || []).includes(role);
    const next = has ? u.roles.filter((r) => r !== role) : [...(u.roles || []), role];
    const { error } = await supabase.from('users').update({ roles: next }).eq('id', u.id);
    if (error) { setMsg('操作失败：' + error.message); return; }
    load();
  }

  async function toggleAdmin(u) {
    setMsg('');
    const next = u.role === 'admin' ? 'user' : 'admin';
    if (next === 'user' && !confirm(`撤销 ${u.username || u.email} 的管理员？`)) return;
    const { error } = await supabase.from('users').update({ role: next }).eq('id', u.id);
    if (error) { setMsg('操作失败：' + error.message); return; }
    load();
  }

  const filtered = list.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (u.username || '').toLowerCase().includes(s)
      || (u.email || '').toLowerCase().includes(s)
      || (u.handle || '').toLowerCase().includes(s);
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15, letterSpacing: '.1em', margin: 0 }}>用户（{list.length}）</h3>
        <span style={{ flex: 1 }} />
        <input
          placeholder="搜名字 / 邮箱 / 主页地址"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ fontSize: 13, padding: '7px 12px', border: '1px solid var(--hair)',
            borderRadius: 8, background: 'rgba(255,255,255,.5)', minWidth: 200 }}
        />
      </div>

      {filtered.map((u) => (
        <div key={u.id} style={{ border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 15 }}>{u.username || '（未命名）'}</strong>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{u.email}</span>
            {u.handle ? <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>/u/{u.handle}</span> : null}
            {u.role === 'admin' ? <span className="status-pill pub">管理员</span> : null}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
              {new Date(u.created_at).toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginRight: 4 }}>身份：</span>
            {ROLES.map(([v, label]) => {
              const on = (u.roles || []).includes(v);
              return (
                <button key={v} onClick={() => toggleRole(u, v)}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 14, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .2s',
                    border: on ? '1px solid var(--seaglass)' : '1px solid var(--hair)',
                    background: on ? 'rgba(93,154,143,.16)' : 'transparent',
                    color: on ? 'var(--ink)' : 'var(--ink-soft)',
                  }}>
                  {on ? '✓ ' : ''}{label}
                </button>
              );
            })}
            <span style={{ flex: 1 }} />
            <button className="btn ghost small" onClick={() => toggleAdmin(u)}
              disabled={u.auth_id === me}>
              {u.role === 'admin' ? '撤销管理员' : '设为管理员'}
            </button>
          </div>
        </div>
      ))}

      <div className="form-msg">{msg}</div>
    </div>
  );
}
