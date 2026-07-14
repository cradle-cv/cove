'use client';
// 刊头左侧的头像与名字。没登录去靠岸；登录后显示头像+名字，点开下拉菜单。
// 菜单用 Portal 渲染到 body，脱离刊头的 overflow:hidden，不会被裁。
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AvatarMenu() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { username, avatar_url, roles, role }
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let alive = true;
    async function load(sess) {
      if (!sess) { if (alive) { setUser(null); setProfile(null); } return; }
      if (alive) setUser(sess.user);
      const { data } = await supabase.from('users')
        .select('username, avatar_url, roles, role').eq('auth_id', sess.user.id).maybeSingle();
      if (alive) setProfile(data || {});
    }
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => load(s));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, left: r.left });
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!user) {
    return (
      <Link className="band-avatar guest" href="/login" aria-label="靠岸 / 登录">
        <span className="avatar-dot" />
        <span className="avatar-name">靠岸</span>
      </Link>
    );
  }

  const name = profile?.username || user.email?.split('@')[0] || '我';
  const avatar = profile?.avatar_url;
  const roles = profile?.roles || [];
  const isAdmin = profile?.role === 'admin';

  const menu = open && mounted ? createPortal(
    <div className="avatar-drop" ref={menuRef} style={{ top: pos.top, left: pos.left }}>
      {roles.includes('songwriter') || isAdmin ? (
        <Link href="/studio" onClick={() => setOpen(false)}>工作台</Link>
      ) : null}
      <Link href="/apply" onClick={() => setOpen(false)}>身份申请</Link>
      {isAdmin ? <Link href="/admin" onClick={() => setOpen(false)}>管理室</Link> : null}
      <button onClick={() => { supabase.auth.signOut(); setOpen(false); }}>退出</button>
    </div>,
    document.body
  ) : null;

  return (
    <div className="band-avatar avatar-menu">
      <button ref={btnRef} className="avatar-trigger" onClick={openMenu}
        aria-label="我的" aria-expanded={open}>
        <span className="avatar-dot on">
          {avatar ? <img src={avatar} alt="" /> : <span className="avatar-initial">{name.slice(0, 1)}</span>}
        </span>
        <span className="avatar-name">{name}</span>
      </button>
      {menu}
    </div>
  );
}
