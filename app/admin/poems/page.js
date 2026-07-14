'use client';

// 管理端 · 玻璃海滩审核与编辑
// 待审核的可通过/隐藏；所有内容可编辑（标题、署名、正文、颜色、音频、生成手记）、撤回、删除。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AudioUploader from '@/components/AudioUploader';

const STATUS_CN = { pending: '待审核', published: '已发布', hidden: '已隐藏' };
const COLORS = [
  ['green', '海玻璃绿'], ['blue', '瓶底蓝'], ['amber', '琥珀'], ['white', '乳白'], ['red', '赭红'],
];

export default function AdminPoemsPage() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // 正在编辑的整条数据
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('cove_poems').select('*').order('created_at', { ascending: false });
    setList(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    setMsg('');
    const { error } = await supabase.from('cove_poems').update({ status }).eq('id', id);
    if (error) { setMsg('操作失败：' + error.message); return; }
    load();
  }

  async function remove(id) {
    if (!confirm('确定删除这一枚？不可恢复。')) return;
    const { error } = await supabase.from('cove_poems').delete().eq('id', id);
    if (error) { setMsg('删除失败：' + error.message); return; }
    load();
  }

  async function save() {
    setMsg('正在保存…');
    const { error } = await supabase.from('cove_poems').update({
      title: editing.title.trim(),
      poet_name: editing.poet_name.trim(),
      body: editing.body,
      glass_color: editing.glass_color,
      gen_note: editing.gen_note?.trim() || null,
      audio_src: editing.audio ? [editing.audio]
        : (Array.isArray(editing.audio_src) ? editing.audio_src : null),
    }).eq('id', editing.id);
    if (error) { setMsg('保存失败：' + error.message); return; }
    setEditing(null); setMsg(''); load();
  }

  // 编辑表单
  if (editing) {
    return (
      <div className="cove-form" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h3 style={{ fontSize: 15, letterSpacing: '.1em', marginBottom: 16 }}>编辑这一枚</h3>

        <label>标题</label>
        <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />

        <label>署名</label>
        <input value={editing.poet_name || ''} onChange={(e) => setEditing({ ...editing, poet_name: e.target.value })} />

        <label>诗（保留换行）</label>
        <textarea rows={10} value={editing.body || ''} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />

        <label>颜色</label>
        <select value={editing.glass_color} onChange={(e) => setEditing({ ...editing, glass_color: e.target.value })}>
          {COLORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <label>音乐（重新上传会替换；留空保持原样）</label>
        <AudioUploader
          value={editing.audio || (Array.isArray(editing.audio_src) ? editing.audio_src[0] : '')}
          onDone={({ url }) => setEditing((p) => ({ ...p, audio: url }))}
        />

        <label>灵感来源（可选）</label>
        <textarea rows={3} value={editing.gen_note || ''} onChange={(e) => setEditing({ ...editing, gen_note: e.target.value })} />

        <div className="form-msg">{msg}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={save}>保存</button>
          <button className="btn ghost" onClick={() => { setEditing(null); setMsg(''); }}>取消</button>
        </div>
      </div>
    );
  }

  const pending = list.filter((p) => p.status === 'pending');
  const rest = list.filter((p) => p.status !== 'pending');

  return (
    <div>
      <h3 style={{ fontSize: 15, letterSpacing: '.1em', margin: '0 0 12px' }}>待审核（{pending.length}）</h3>
      {pending.length === 0 ? <p className="dredging" style={{ padding: '10px 0 26px' }}>没有待审核的</p> : null}
      {pending.map((p) => <Row key={p.id} p={p} setStatus={setStatus} setEditing={setEditing} remove={remove} />)}

      <h3 style={{ fontSize: 15, letterSpacing: '.1em', margin: '30px 0 12px' }}>全部</h3>
      {rest.map((p) => <Row key={p.id} p={p} setStatus={setStatus} setEditing={setEditing} remove={remove} />)}

      <div className="form-msg">{msg}</div>
    </div>
  );
}

function Row({ p, setStatus, setEditing, remove }) {
  const [open, setOpen] = useState(false);
  const audio = Array.isArray(p.audio_src) ? p.audio_src[0] : null;
  return (
    <div style={{ border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 18px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>{p.title}</strong>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.poet_name}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{audio ? '有音频' : '无音频'}</span>
        <span className={'status-pill' + (p.status === 'published' ? ' pub' : '')}>{STATUS_CN[p.status]}</span>
        <span style={{ flex: 1 }} />
        <button className="btn ghost small" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '查看'}</button>
        <button className="btn ghost small" onClick={() => setEditing({ ...p, audio: '' })}>编辑</button>
        {p.status !== 'published' ? (
          <button className="btn small" onClick={() => setStatus(p.id, 'published')}>通过</button>
        ) : (
          <button className="btn ghost small" onClick={() => setStatus(p.id, 'hidden')}>撤回</button>
        )}
        {p.status === 'pending' ? (
          <button className="btn ghost small" onClick={() => setStatus(p.id, 'hidden')}>隐藏</button>
        ) : null}
        <button className="btn ghost small" onClick={() => remove(p.id)}>删除</button>
      </div>

      {open ? (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 2, fontWeight: 300 }}>{p.body}</div>
          {audio ? <audio controls preload="none" src={audio} style={{ width: '100%', marginTop: 12 }} /> : null}
          {p.gen_note ? (
            <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.9 }}>
              灵感来源：{p.gen_note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
