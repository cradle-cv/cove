'use client';
// 刊头头像 + 名字。样式内联，不依赖 globals.css，避免缓存导致错位。
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const S = {
  wrap: { display: 'flex', alignItems: 'center', flex: '0 0 auto' },
  trigger: { display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'none' },
  dot: { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flex: '0 0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1.5px solid rgba(246,239,224,.5)', background: 'rgba(93,154,143,.32)' },
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  initial: { fontFamily: 'var(--font-hand), serif', fontSize: 16, color: '#F6EFE0', lineHeight: 1 },
  name: { fontSize: 13.5, letterSpacing: '.06em', color: '#F6EFE0', whiteSpace: 'nowrap',
    maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 },
};

export default function AvatarMenu() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
      <Link href="/login" aria-label="靠岸 / 登录" style={{ ...S.trigger }}>
        <span style={S.dot} />
        <span style={{ ...S.name, opacity: .72 }}>靠岸</span>
      </Link>
    );
  }

  const name = profile?.username || user.email?.split('@')[0] || '我';
  const avatar = profile?.avatar_url;
  const roles = profile?.roles || [];
  const isAdmin = profile?.role === 'admin';

  const menu = open && mounted ? createPortal(
    <div ref={menuRef} className="avatar-drop" style={{ top: pos.top, left: pos.left }}>
      <Link href="/me" onClick={() => setOpen(false)}>我的</Link>
      {profile?.handle ? <Link href={`/u/${profile.handle}`} onClick={() => setOpen(false)}>我的主页</Link> : null}
      <Link href="/apply" onClick={() => setOpen(false)}>身份申请</Link>
      {isAdmin ? <Link href="/admin" onClick={() => setOpen(false)}>后台</Link> : null}
      <button onClick={() => { supabase.auth.signOut(); setOpen(false); }}>退出</button>
    </div>,
    document.body
  ) : null;

  return (
    <div style={S.wrap}>
      <button ref={btnRef} onClick={openMenu} style={S.trigger} aria-label="我的" aria-expanded={open}>
        <span style={S.dot}>
          {avatar ? <img src={avatar} alt="" style={S.img} /> : <span style={S.initial}>{name.slice(0, 1)}</span>}
        </span>
        <span style={S.name}>{name}</span>
      </button>
      {menu}
    </div>
  );
}
