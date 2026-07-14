'use client';
// 刊头左侧的头像。没登录去靠岸；登录后点开下拉菜单。
// 菜单用 Portal 渲染到 body，彻底脱离刊头的 overflow:hidden，不会被裁。
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AvatarMenu() {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let alive = true;
    async function load(sess) {
      if (!sess) { if (alive) { setUser(null); setRoles([]); setIsAdmin(false); } return; }
      if (alive) setUser(sess.user);
      const { data } = await supabase.from('users')
        .select('roles, role').eq('auth_id', sess.user.id).maybeSingle();
      if (alive) { setRoles(data?.roles || []); setIsAdmin(data?.role === 'admin'); }
    }
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => load(s));
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  // 打开时按按钮位置算菜单坐标
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
      <Link className="band-avatar" href="/login" aria-label="靠岸 / 登录">
        <span className="avatar-dot" />
      </Link>
    );
  }

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
      <button ref={btnRef} className="avatar-dot on" onClick={openMenu}
        aria-label="我的" aria-expanded={open} />
      {menu}
    </div>
  );
}
