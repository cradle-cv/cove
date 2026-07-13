'use client';

// 管理端 · 身份申请审核
// 通过 = 把申请标为 approved，并把身份写进该用户的 users.roles。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const ROLE_CN = { songwriter: '词曲者', performer: '歌手/乐手', producer: '制作人', organization: '音乐机构' };
const STATUS_CN = { pending: '待审核', approved: '已通过', rejected: '未通过' };

export default function AdminApplicationsPage() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('cove_applications')
      .select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function approve(a) {
    setMsg('');
    // 1) 给用户加身份
    const { data: u, error: e1 } = await supabase.from('users')
      .select('id, roles').eq('auth_id', a.auth_id).maybeSingle();
    if (e1 || !u) { setMsg('找不到该用户'); return; }
    if (!(u.roles || []).includes(a.role_applied)) {
      const { error: e2 } = await supabase.from('users')
        .update({ roles: [...(u.roles || []), a.role_applied] }).eq('id', u.id);
      if (e2) { setMsg('授身份失败：' + e2.message); return; }
    }
    // 2) 标记申请
    const { error: e3 } = await supabase.from('cove_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', a.id);
    if (e3) { setMsg('更新申请失败：' + e3.message); return; }
    load();
  }

  async function reject(a) {
    setMsg('');
    const { error } = await supabase.from('cove_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', a.id);
    if (error) { setMsg('操作失败：' + error.message); return; }
    load();
  }

  const pending = list.filter((x) => x.status === 'pending');
  const rest = list.filter((x) => x.status !== 'pending');

  return (
    <div>
      <h3 style={{ fontSize: 15, letterSpacing: '.1em', margin: '0 0 12px' }}>待审核（{pending.length}）</h3>
      {pending.length === 0 ? <p className="dredging" style={{ padding: '10px 0 26px' }}>没有待审核的</p> : null}
      {pending.map((a) => <Row key={a.id} a={a} approve={approve} reject={reject} />)}

      <h3 style={{ fontSize: 15, letterSpacing: '.1em', margin: '30px 0 12px' }}>全部</h3>
      {rest.map((a) => <Row key={a.id} a={a} approve={approve} reject={reject} />)}
      <div className="form-msg">{msg}</div>
    </div>
  );
}

function Row({ a, approve, reject }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>{a.display_name}</strong>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ROLE_CN[a.role_applied]}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          {new Date(a.created_at).toLocaleDateString('zh-CN')}
        </span>
        <span className={'status-pill' + (a.status === 'approved' ? ' pub' : '')}>{STATUS_CN[a.status]}</span>
        <span style={{ flex: 1 }} />
        <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '查看'}</button>
        {a.status === 'pending' ? (
          <>
            <button className="btn small" onClick={() => approve(a)}>通过</button>
            <button className="btn ghost small" onClick={() => reject(a)}>拒绝</button>
          </>
        ) : null}
      </div>
      {open ? (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--hair)', paddingTop: 12,
          fontSize: 13.5, lineHeight: 1.95, fontWeight: 300, whiteSpace: 'pre-wrap' }}>
          {a.statement}
          {a.links ? <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--ink-soft)' }}>链接：{a.links}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
