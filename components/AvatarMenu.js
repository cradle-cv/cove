'use client';
// 刊头左侧的头像。
// 没登录：点击去靠岸。登录了：下拉菜单，按身份显示工作台等入口。
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AvatarMenu() {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    async function load(sess) {
      if (!sess) { if (alive) { setUser(null); setRoles([]); } return; }
      if (alive) setUser(sess.user);
      const { data } = await supabase.from('users')
        .select('roles, role').eq('auth_id', sess.user.id).maybeSingle();
      if (alive) setRoles([...(data?.roles || []), ...(data?.role === 'admin' ? ['admin'] : [])]);
    }
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => load(s));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) {
    return (
      <Link className="band-avatar" href="/login" aria-label="靠岸 / 登录">
        <span className="avatar-dot" />
      </Link>
    );
  }

  const isSongwriter = roles.includes('songwriter');

  return (
    <div className="band-avatar avatar-menu" ref={ref}>
      <button className="avatar-dot on" onClick={() => setOpen((v) => !v)}
        aria-label="我的" aria-expanded={open} />
      {open ? (
        <div className="avatar-drop">
          {isSongwriter ? <Link href="/studio" onClick={() => setOpen(false)}>工作台</Link> : null}
          <Link href="/apply" onClick={() => setOpen(false)}>身份申请</Link>
          {roles.includes('admin') ? <Link href="/admin" onClick={() => setOpen(false)}>管理室</Link> : null}
          <button onClick={() => { supabase.auth.signOut(); setOpen(false); }}>退出</button>
        </div>
      ) : null}
    </div>
  );
}
