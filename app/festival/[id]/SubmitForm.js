'use client';

// 音乐节报名（Rule B：编辑权只看截稿期）
// 截稿前：可报名、可修改、可撤回；截稿后：全部锁定，只读。
// 审核状态（pending/accepted/declined）不影响编辑权，同摇篮已验证的规则。

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';

export default function SubmitForm({ festival }) {
  const { session, profile, loading } = useUser();
  const [mine, setMine] = useState(null);     // 我的报名（单角色一条，取第一条编辑）
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [msg, setMsg] = useState('');

  const roles = Array.isArray(festival.roles_needed) ? festival.roles_needed : [];
  const beforeDeadline = festival.deadline
    ? new Date(festival.deadline) > new Date()
    : false;
  const editable = festival.status === 'open' && beforeDeadline;

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('cove_festival_submissions').select('*')
      .eq('festival_id', festival.id).eq('user_id', profile.id)
      .order('created_at').limit(1).maybeSingle();
    setMine(data || null);
    if (data) { setRole(data.role); setMessage(data.message || ''); }
  }, [profile, festival.id]);
  useEffect(() => { load(); }, [load]);

  async function submit() {
    setMsg('');
    if (!editable) { setMsg('已截稿，名单交给海。'); return; }
    if (!role) { setMsg('先选一个角色'); return; }
    if (mine) {
      const { error } = await supabase.from('cove_festival_submissions')
        .update({ role, message, updated_at: new Date().toISOString() })
        .eq('id', mine.id);
      if (error) { setMsg(error.message); return; }
      setMsg('已更新。截稿前都可以再改。');
    } else {
      const { error } = await supabase.from('cove_festival_submissions')
        .insert({ festival_id: festival.id, user_id: profile.id, role, message });
      if (error) { setMsg(error.message); return; }
      setMsg('报名已投出。截稿前都可以再改。');
    }
    load();
  }

  async function withdraw() {
    if (!mine || !editable) return;
    await supabase.from('cove_festival_submissions').delete().eq('id', mine.id);
    setMine(null); setRole(''); setMessage(''); setMsg('已撤回。');
  }

  if (loading) return null;

  if (!session) {
    return (
      <p className="dredging" style={{ paddingTop: 0 }}>
        <Link href="/login">登录</Link>之后可以应征
      </p>
    );
  }

  const REVIEW_CN = { pending: '待回音', accepted: '已收下', declined: '这次先谢过' };

  return (
    <div className="cove-form" style={{ maxWidth: 460, marginTop: 30 }}>
      {mine ? (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)' }}>
          你已应征「{mine.role}」 · {REVIEW_CN[mine.review_status] || mine.review_status}
        </p>
      ) : null}

      <label>应征角色</label>
      <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!editable}>
        <option value="">选一个</option>
        {roles.map((r, i) => <option key={i} value={r.role}>{r.role}</option>)}
      </select>
      <label>自荐（一两句就好）</label>
      <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} disabled={!editable} />
      <div className="form-msg">{msg}</div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn" onClick={submit} disabled={!editable}>
          {mine ? '更新报名' : '投出报名'}
        </button>
        {mine && editable ? (
          <button className="btn ghost" onClick={withdraw}>撤回</button>
        ) : null}
      </div>
    </div>
  );
}
