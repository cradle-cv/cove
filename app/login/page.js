'use client';

// 登录 / 注册（邮箱 + 密码）
// 注册成功后 auth 触发器 handle_new_user 会自动创建业务 users 行。

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !password) { setMsg('邮箱和密码都要填'); return; }
    setBusy(true); setMsg('');
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    if (mode === 'signup') { setMsg('注册成功。若开启了邮箱验证，请先去收件箱确认。'); return; }
    router.push('/');
  }

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">{mode === 'login' ? 'Sign In' : 'Sign Up'}</div>
        <div className="th">{mode === 'login' ? '回到港湾' : '第一次靠岸'}</div>
        <div className="hairline" />
      </div>

      <div className="cove-form" style={{ maxWidth: 380 }}>
        <label>邮箱</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <label>密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        <div className="form-msg">{msg}</div>
        <button className="btn" onClick={submit} disabled={busy}>
          {mode === 'login' ? '登 录' : '注 册'}
        </button>
        <button className="btn ghost" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}>
          {mode === 'login' ? '还没有账号，去注册' : '已有账号，去登录'}
        </button>
      </div>
    </main>
  );
}
