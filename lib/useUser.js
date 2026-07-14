'use client';

// useUser —— 当前登录状态 + 业务 users 行
// 返回 { session, profile, loading, signOut, isAdmin }
// profile 来自 public.users（含 id / role），是 RLS 策略认的身份。
//
// 关键：切回浏览器标签页时，Supabase 会重发 auth 事件（SIGNED_IN / TOKEN_REFRESHED），
// 若无条件 setSession / loadProfile，会让整棵组件树重渲染、编辑态丢失、页面弹回。
// 因此只在“用户真的变了”时才更新 state；同一用户的 token 刷新一律忽略。

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUidRef = useRef(null); // 当前已加载的用户 id

  useEffect(() => {
    let alive = true;

    async function loadProfile(sess) {
      if (!sess) { if (alive) { setProfile(null); setLoading(false); } return; }
      const { data } = await supabase
        .from('users').select('id, email, username, role')
        .eq('auth_id', sess.user.id).maybeSingle();
      if (alive) { setProfile(data || null); setLoading(false); }
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!alive) return;
      currentUidRef.current = s?.user?.id || null;
      setSession(s);
      loadProfile(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      const newUid = s?.user?.id || null;
      // 用户没变（只是 token 刷新 / 标签页切回）→ 什么都不做，避免整页重置
      if (newUid === currentUidRef.current) return;
      currentUidRef.current = newUid;
      setSession(s);
      loadProfile(s);
    });

    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { session, profile, loading, signOut, isAdmin: ['admin', 'superadmin'].includes(profile?.role) };
}
