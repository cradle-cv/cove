'use client';

// 漂流瓶 —— 听众回声
// 锚定一首歌。没有点赞、没有回复、没有排序权重，只浮，不互动。
// 投放需要登录；未登录只读，并给一个安静的登录入口。

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';

export default function Echoes({ trackId }) {
  const { session, profile } = useUser();
  const [list, setList] = useState([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!trackId) return;
    const { data } = await supabase
      .from('cove_echoes').select('id, body')
      .eq('track_id', trackId)
      .order('created_at', { ascending: false })
      .limit(40);
    setList(data || []);
  }, [trackId]);
  useEffect(() => { load(); }, [load]);

  async function drop() {
    const body = text.trim();
    if (!body) return;
    if (body.length > 60) { setMsg('一句话就好，六十字以内'); return; }
    setMsg('');
    const { error } = await supabase.from('cove_echoes').insert({
      track_id: trackId, user_id: profile?.id || null, body,
    });
    if (error) { setMsg('没投进去，再试一次'); return; }
    setText(''); load();
  }

  return (
    <div className="echoes">
      <div className="lead">漂 流 瓶</div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 300, lineHeight: 1.9 }}>
        这首歌让你想起什么，留一句投进海里。<br />
        没有评分，只是听过同一首歌的人会看见彼此。
      </p>

      {session ? (
        <div className="field">
          <input value={text} maxLength={60} placeholder="写下一句"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') drop(); }} />
          <button className="submit" onClick={drop}>投放</button>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 12 }}>
          <Link href="/login">登录</Link>之后可以投放一句
        </p>
      )}
      <div className="form-msg">{msg}</div>

      <div className="bottles">
        {list.map((e) => <span key={e.id} className="bottle">{e.body}</span>)}
      </div>
    </div>
  );
}
