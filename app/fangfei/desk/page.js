'use client';
// 港口甲 · 编辑台。只有 ff_members.role = 'editor' 的人能看到待审稿并放行。
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HarborADesk() {
  const [user, setUser] = useState(undefined);
  const [editor, setEditor] = useState(false);
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('pending');
  const [msg, setMsg] = useState('');

  const load = useCallback(async (status) => {
    const { data } = await supabase.from('ff_poems')
      .select('id, poet_name, title, body, status, created_at, published_at')
      .eq('status', status).order('created_at', { ascending: false });
    setRows(data || []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data?.session?.user || null;
      setUser(u);
      if (!u) return;
      const { data: m } = await supabase.from('ff_members').select('role').eq('auth_id', u.id).maybeSingle();
      const ok = m?.role === 'editor';
      setEditor(ok);
      if (ok) load('pending');
    })();
  }, [load]);

  useEffect(() => { if (editor) load(tab); }, [tab, editor, load]);

  const setStatus = async (id, status) => {
    setMsg('');
    const patch = { status };
    if (status === 'published') patch.published_at = new Date().toISOString();
    const { error } = await supabase.from('ff_poems').update(patch).eq('id', id);
    if (error) { setMsg(error.message); return; }
    load(tab);
  };

  if (user === undefined) return null;
  if (!user) {
    return (
      <main className="ff-main"><div className="ff-page-head">
        <div className="ff-page-title">编辑台</div>
        <div className="ff-page-sub">先<Link href="/login" style={{ margin: '0 4px' }}>靠岸</Link>。</div>
        </div></main>
    );
  }
  if (!editor) {
    return (
      <main className="ff-main"><div className="ff-page-head">
        <div className="ff-page-title">编辑台</div>
        <div className="ff-page-sub">这里只有诗社的编辑能进。</div>
        </div></main>
    );
  }
  return (
    <main className="ff-main">
      <div className="ff-page-head">
        
        <div className="ff-page-title">编辑台</div>
        
      </div>
      <div className="me-tabs">
        {[['pending', '待读'], ['published', '已放上'], ['hidden', '已收起']].map(([v, l]) => (
          <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      {msg ? <div className="form-msg">{msg}</div> : null}
      <table className="admin-table">
        <thead><tr><th>标题</th><th>署名</th><th>开头</th><th>时间</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.title}</td>
              <td>{r.poet_name}</td>
              <td style={{ color: 'var(--ink-soft)', fontWeight: 300 }}>
                {(r.body || '').split('\n').find((l) => l.trim())?.slice(0, 24)}
              </td>
              <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--ink-soft)' }}>
                {new Date(r.published_at || r.created_at).toLocaleDateString('zh-CN')}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {r.status !== 'published'
                  ? <button className="btn small" onClick={() => setStatus(r.id, 'published')}>放上</button>
                  : null}
                {r.status !== 'hidden'
                  ? <button className="btn small ghost" style={{ marginLeft: 6 }}
                      onClick={() => setStatus(r.id, 'hidden')}>收起</button>
                  : null}
                {r.status === 'published'
                  ? <Link href={`/fangfei/${r.id}`} className="btn small ghost" style={{ marginLeft: 6 }}>看</Link>
                  : null}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={5} className="dredging">这一格是空的</td></tr> : null}
        </tbody>
      </table>
    </main>
  );
}
