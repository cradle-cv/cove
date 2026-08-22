'use client';
// 港口甲 · 投稿。登录后可投，进 pending，诗社编辑放行后出现。
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AudioUploader from '@/components/AudioUploader';

export default function HarborASubmit() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ poet_name: '', title: '', body: '', gen_note: '', audio: '' });
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
  }, []);

  const submit = async () => {
    if (!form.poet_name.trim() || !form.title.trim() || !form.body.trim()) {
      setMsg('署名、标题、正文都要有'); return;
    }
    setMsg('正在送到诗社…');
    const { error } = await supabase.from('ff_poems').insert({
      author_auth_id: user.id,
      poet_name: form.poet_name.trim(),
      title: form.title.trim(),
      body: form.body,
      gen_note: form.gen_note.trim() || null,
      audio_src: form.audio ? [form.audio] : null,
      hue: 1 + Math.floor(Math.random() * 12),
    });
    if (error) { setMsg('没有送到：' + error.message); return; }
    setDone(true);
  };

  if (user === null) {
    return (
      <main className="ff-main">
        <div className="ff-page-head">
          
          <div className="ff-page-title">港口甲</div>
          <div className="ff-page-sub">先<Link href="/login" style={{ margin: '0 4px' }}>靠岸</Link>，才能投稿。</div>
          
        </div>
      </main>
    );
  }
  if (done) {
    return (
      <main className="ff-main">
        <div className="ff-page-head">
          
          <div className="ff-page-title">送到了</div>
          <div className="ff-page-sub">诗社的编辑读过之后，它会出现在这里。</div>
          
        </div>
        <p className="ff-back" style={{ textAlign: 'center' }}><Link href="/fangfei">← 回到笺架</Link></p>
      </main>
    );
  }
  return (
    <main className="ff-main">
      <div className="ff-page-head">
        
        <div className="ff-page-title">投一首</div>
        <div className="ff-page-sub">诗或短故事，可以配一段你用 AI 做出来的音乐。颜色由海水决定。</div>
        
      </div>
      <div className="cove-form" style={{ maxWidth: 560, margin: '0 auto' }}>
        <label>署名</label>
        <input value={form.poet_name} onChange={(e) => setForm({ ...form, poet_name: e.target.value })} />
        <label>标题</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label>正文（保留换行）</label>
        <textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <label>音乐（可选；mp3，10MB 以内）</label>
        <AudioUploader value={form.audio} onDone={({ url }) => setForm((f) => ({ ...f, audio: url }))} />
        <label>创作手记（可选）</label>
        <textarea rows={3} value={form.gen_note} onChange={(e) => setForm({ ...form, gen_note: e.target.value })} />
        <div className="form-msg">{msg}</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn" onClick={submit}>送到诗社</button>
        </div>
      </div>
    </main>
  );
}
