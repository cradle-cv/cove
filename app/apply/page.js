'use client';
// 身份申请 · 词曲者 / 歌手乐手 / 制作人 / 音乐机构
// 同构摇篮的艺术家/策展人/合作伙伴申请：自述 + 作品链接，管理员审核后授身份。
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const ROLES = [
  ['songwriter', '词曲者', '写词、写曲。通过后可以在工作台上传词曲，并用 AI 做小样。'],
  ['performer', '歌手 / 乐手', '唱歌或演奏。可以报名每日演出的邀请函。'],
  ['producer', '制作人', '可以在每日演出发起演出征人与乐团招募。'],
  ['organization', '音乐机构', '唱片公司、工作室、酒吧、琴行。可以承接场地、出现在邻港。'],
];
const ROLE_CN = Object.fromEntries(ROLES.map(([v, l]) => [v, l]));
const STATUS_CN = { pending: '审核中', approved: '已通过', rejected: '未通过' };

export default function ApplyPage() {
  const [user, setUser] = useState(undefined); // undefined=加载中
  const [mine, setMine] = useState([]);        // 我的申请记录
  const [myRoles, setMyRoles] = useState([]);
  const [form, setForm] = useState({ role_applied: 'songwriter', display_name: '', statement: '', links: '' });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (!u) return;
      const [{ data: apps }, { data: prof }] = await Promise.all([
        supabase.from('cove_applications').select('*').eq('auth_id', u.id).order('created_at', { ascending: false }),
        supabase.from('users').select('roles').eq('auth_id', u.id).maybeSingle(),
      ]);
      setMine(apps || []);
      setMyRoles(prof?.roles || []);
    });
  }, []);

  const submit = async () => {
    if (!form.display_name.trim() || !form.statement.trim()) {
      setMsg('名字和自述都要有'); return;
    }
    if (mine.some((a) => a.role_applied === form.role_applied && a.status === 'pending')) {
      setMsg('这个身份已经有一份在审核中的申请'); return;
    }
    setMsg('正在提交…');
    const { error } = await supabase.from('cove_applications').insert({
      auth_id: user.id,
      role_applied: form.role_applied,
      display_name: form.display_name.trim(),
      statement: form.statement.trim(),
      links: form.links.trim() || null,
    });
    if (error) { setMsg('提交失败：' + error.message); return; }
    setDone(true);
  };

  if (user === undefined) return <main className="sheet"><p className="dredging">正在核对身份</p></main>;

  if (!user) {
    return (
      <main className="sheet">
        <div className="sheet-head">
          <div className="no">Apply</div><div className="th">身份申请</div>
          <div className="sub">先<Link href="/login" style={{ margin: '0 4px' }}>靠岸</Link>，再来申请身份。</div>
          <div className="hairline" />
        </div>
      </main>
    );
  }

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Apply</div>
        <div className="th">身份申请</div>
        <div className="sub">四种身份，各有各的门。写清楚你做过什么，想在海角做什么。</div>
        <div className="hairline" />
      </div>

      {myRoles.length > 0 ? (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 24 }}>
          你已有身份：{myRoles.map((r) => ROLE_CN[r] || r).join('、')}
        </p>
      ) : null}

      {mine.length > 0 ? (
        <div style={{ maxWidth: 560, margin: '0 auto 30px' }}>
          {mine.map((a) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, fontSize: 13, padding: '8px 0',
              borderBottom: '1px solid var(--hair)', color: 'var(--ink-soft)' }}>
              <span>{ROLE_CN[a.role_applied]}</span>
              <span style={{ flex: 1 }}>{a.display_name}</span>
              <span className={'status-pill' + (a.status === 'approved' ? ' pub' : '')}>{STATUS_CN[a.status]}</span>
            </div>
          ))}
        </div>
      ) : null}

      {done ? (
        <p className="dredging">申请已经收到。审过之后，你的头像菜单里会多出对应的门。</p>
      ) : (
        <div className="cove-form" style={{ maxWidth: 560, margin: '0 auto' }}>
          <label>申请的身份</label>
          <select value={form.role_applied} onChange={(e) => setForm({ ...form, role_applied: e.target.value })}>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.8, margin: '2px 0 8px' }}>
            {ROLES.find(([v]) => v === form.role_applied)?.[2]}
          </p>

          <label>名字（对外显示，可以是笔名或机构名）</label>
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />

          <label>自述（做过什么，想在海角做什么）</label>
          <textarea rows={6} value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} />

          <label>作品或资料链接（可不填）</label>
          <input value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })}
            placeholder="网易云 / B站 / 个人主页…" />

          <div className="form-msg">{msg}</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn" onClick={submit}>提交申请</button>
          </div>
        </div>
      )}
    </main>
  );
}
