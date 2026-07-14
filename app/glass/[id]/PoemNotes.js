'use client';
// 访客在这枚玻璃下留一句话。像在沙滩上捡到它之后，写下什么。
// 无需登录。
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PoemNotes({ poemId, initialNotes }) {
  const [notes, setNotes] = useState(initialNotes || []);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit() {
    const text = body.trim();
    if (!text) { setMsg('还没有写下什么'); return; }
    setBusy(true); setMsg('');
    const visitor = name.trim() || '路过的人';
    const { data, error } = await supabase
      .from('cove_poem_notes')
      .insert({ poem_id: poemId, visitor_name: visitor, body: text })
      .select('id, visitor_name, body, created_at')
      .single();
    setBusy(false);
    if (error) { setMsg('没有留下：' + error.message); return; }
    setNotes([data, ...notes]);
    setBody(''); setName('');
  }

  return (
    <section className="poem-notes">
      <div className="pn-cap">留在这枚玻璃旁的话</div>

      <div className="pn-form">
        <input
          className="pn-name"
          placeholder="署名（可不填）"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="pn-body"
          placeholder="捡起它的时候，你想到了什么"
          value={body}
          maxLength={500}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="pn-actions">
          <span className="pn-msg">{msg}</span>
          <button className="btn small" onClick={submit} disabled={busy}>
            {busy ? '放下…' : '放下这句话'}
          </button>
        </div>
      </div>

      {notes.length > 0 ? (
        <ul className="pn-list">
          {notes.map((n) => (
            <li key={n.id} className="pn-item">
              <p className="pn-text">{n.body}</p>
              <div className="pn-meta">
                <span className="pn-who">{n.visitor_name}</span>
                <span className="pn-when">{fmt(n.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pn-empty">还没有人在这里留下话。</p>
      )}
    </section>
  );
}

function fmt(ts) {
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
}
