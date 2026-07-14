'use client';

// useUser —— 当前登录状态 + 业务 users 行
// 返回 { session, profile, loading, signOut }
// profile 来自 public.users（含 id / role），是 RLS 策略认的身份。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setSession(s);
      loadProfile(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // 切回标签页时 Supabase 会重发 SIGNED_IN / TOKEN_REFRESHED，
      // 这里只静默刷新 profile，不再 setLoading(true)，避免整页重置。
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        loadProfile(s); // 不动 loading
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { session, profile, loading, signOut, isAdmin: ['admin', 'superadmin'].includes(profile?.role) };
}
