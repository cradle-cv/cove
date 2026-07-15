'use client';

// 管理端 · 歌曲与字幕
// 字幕录入格式：每行一句 —— "时机 空格 文字"，文字里用【】包住强调段。
//   0.58 老人听完只说，这调子【像涨潮】。后来这三个字成了歌名。
// 保存时解析为结构化 segments（{"t":..}/{"t":..,"em":true}），整表替换该曲的 cove_beats。

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AudioUploader from '@/components/AudioUploader';

// 【】→ segments
export function parseBeatLine(line) {
  const m = line.trim().match(/^([0-9.]+)\s+(.+)$/);
  if (!m) return null;
  const at = parseFloat(m[1]);
  if (Number.isNaN(at) || at < 0 || at > 1) return null;
  const segments = [];
  m[2].split(/(【[^】]*】)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('【') && part.endsWith('】')) {
      const t = part.slice(1, -1);
      if (t) segments.push({ t, em: true });
    } else segments.push({ t: part });
  });
  return segments.length ? { at, segments } : null;
}

// segments → 行
export function beatToLine(b) {
  const text = (b.segments || []).map((s) => (s.em ? `【${s.t}】` : s.t)).join('');
  return `${Number(b.at)} ${text}`;
}

const EMPTY = {
  title: '', title_en: '', place: '', seal: '', lead_instrument: '', duration: 200, src_text: '', lyrics_text: '', waveform: null, external_links: [],
  musician_id: '', art: '', sea: '', cover_url: '', status: 'draft',
};

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [editing, setEditing] = useState(null);   // null | {id?, ...fields}
  const [beatsText, setBeatsText] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('cove_tracks').select('*, cove_musicians(name)').order('created_at', { ascending: false }).order('id', { ascending: true }),
      supabase.from('cove_musicians').select('id, name').eq('status', 'active'),
    ]);
    setTracks(t || []); setMusicians(m || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openEdit(t) {
    setMsg('');
    if (!t) { setEditing({ ...EMPTY }); setBeatsText(''); return; }
    setEditing({
      ...t,
      // src 是 jsonb 数组 → 文本框用多行字符串
      src_text: Array.isArray(t.src) ? t.src.join('\n') : (typeof t.src === 'string' ? t.src : ''),
      external_links: Array.isArray(t.external_links) && t.external_links.length
        ? t.external_links
        : (t.external_url ? [{ platform: t.external_platform || '', url: t.external_url }] : []),
      lyrics_text: Array.isArray(t.lyrics)
        ? t.lyrics.map((x) => (typeof x === 'string' ? x : x.l)).join('\n')
        : '',
      waveform: Array.isArray(t.waveform) ? t.waveform : null,
    });
    const { data: beats } = await supabase
      .from('cove_beats').select('*').eq('track_id', t.id).order('ord');
    setBeatsText((beats || []).map(beatToLine).join('\n'));
  }

  async function save() {
    setMsg('');
    const parsed = beatsText.split('\n').map((l) => l.trim()).filter(Boolean).map(parseBeatLine);
    if (parsed.some((p) => !p)) { setMsg('字幕有格式错误的行：应为 "0.58 文字…"，时机 0 到 1'); return; }

    const row = {
      title: editing.title, title_en: editing.title_en, place: editing.place,
      lead_instrument: editing.lead_instrument || null,
      src: (editing.src_text || '')
        .split('\n').map((x) => x.trim()).filter(Boolean).length
        ? (editing.src_text || '').split('\n').map((x) => x.trim()).filter(Boolean)
        : null,
      lyrics: (editing.lyrics_text || '').split('\n').map((x) => x.trim()).filter(Boolean).length
        ? (editing.lyrics_text || '').split('\n').map((x) => x.trim()).filter(Boolean)
        : null,
      waveform: Array.isArray(editing.waveform) && editing.waveform.length ? editing.waveform : null,
      seal: editing.seal, duration: Number(editing.duration) || null,
      musician_id: editing.musician_id || null,
      art: editing.art || null, sea: editing.sea || null,
      cover_url: editing.cover_url || null, status: editing.status,
      external_links: (editing.external_links || [])
        .filter((l) => l && l.url && l.url.trim())
        .map((l) => ({ platform: (l.platform || '').trim(), url: l.url.trim() })),
      external_url: null, external_platform: null,
    };
    let trackId = editing.id;
    if (trackId) {
      const { error } = await supabase.from('cove_tracks').update(row).eq('id', trackId);
      if (error) { setMsg(error.message); return; }
    } else {
      const { data, error } = await supabase.from('cove_tracks').insert(row).select('id').single();
      if (error) { setMsg(error.message); return; }
      trackId = data.id;
    }

    // 字幕整表替换
    await supabase.from('cove_beats').delete().eq('track_id', trackId);
    if (parsed.length) {
      const { error: be } = await supabase.from('cove_beats').insert(
        parsed.map((b, i) => ({ track_id: trackId, ord: i + 1, at: b.at, segments: b.segments }))
      );
      if (be) { setMsg(be.message); return; }
    }
    setEditing(null); setBeatsText(''); load();
  }

  if (editing) {
    return (
      <div className="cove-form">
        <label>歌名</label>
        <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
        <label>英文名</label>
        <input value={editing.title_en || ''} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} />
        <label>音乐人</label>
        <select value={editing.musician_id || ''} onChange={(e) => setEditing({ ...editing, musician_id: e.target.value })}>
          <option value="">（未指定）</option>
          {musicians.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <label>来处（如 东山岛 · 1986）</label>
        <input value={editing.place || ''} onChange={(e) => setEditing({ ...editing, place: e.target.value })} />
        <label>主奏乐器</label>
        <input value={editing.lead_instrument || ''} onChange={(e) => setEditing({ ...editing, lead_instrument: e.target.value })} placeholder="木吉他 / 钢琴 / 大提琴…" />
        <label>印章单字</label>
        <input value={editing.seal || ''} maxLength={1} onChange={(e) => setEditing({ ...editing, seal: e.target.value })} />
        <label>时长（秒）</label>
        <input type="number" value={editing.duration || ''} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} />
        <label>音频</label>
        <AudioUploader
          value={(editing.src_text || '').split('\n')[0] || ''}
          waveform={editing.waveform}
          onDone={({ url, waveform, duration }) =>
            setEditing((p) => ({
              ...p,
              src_text: url,
              waveform: waveform || p.waveform,
              duration: duration || p.duration,
            }))
          }
        />
        <label>或手填音频链接（一行一个）</label>
        <textarea
          rows={2}
          value={editing.src_text || ''}
          onChange={(e) => setEditing({ ...editing, src_text: e.target.value })}
          placeholder="https://pub-xxxx.r2.dev/covemusic/song.mp3"
        />

        <div style={{ margin: '18px 0 6px', paddingTop: 16, borderTop: '1px solid var(--hair)' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
            名曲解读用外链：不上传音频，填下面的平台链接 + 时长。可加多个平台（如 Spotify 站内嵌入播放给海外读者、网易云跳转给大陆读者）。点播放会弹小窗，字幕按时长照常涨潮。
          </div>
        </div>
        <label>外链平台（可加多个）</label>
        {(editing.external_links || []).map((lnk, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              style={{ flex: '0 0 130px' }}
              value={lnk.platform || ''}
              placeholder="网易云 / Spotify"
              onChange={(e) => {
                const next = [...editing.external_links];
                next[idx] = { ...next[idx], platform: e.target.value };
                setEditing({ ...editing, external_links: next });
              }}
            />
            <input
              style={{ flex: 1 }}
              value={lnk.url || ''}
              placeholder="平台「分享」按钮复制的官方链接"
              onChange={(e) => {
                const next = [...editing.external_links];
                next[idx] = { ...next[idx], url: e.target.value };
                setEditing({ ...editing, external_links: next });
              }}
            />
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setEditing({ ...editing, external_links: editing.external_links.filter((_, i) => i !== idx) })}
            >
              删
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn ghost small"
          onClick={() => setEditing({ ...editing, external_links: [...(editing.external_links || []), { platform: '', url: '' }] })}
        >
          ＋ 加一个平台
        </button>

        <label>歌词（一行一句；侧栏低调呈现，不与涨潮字幕争重心）</label>
        <textarea
          rows={6}
          value={editing.lyrics_text || ''}
          onChange={(e) => setEditing({ ...editing, lyrics_text: e.target.value })}
          placeholder={'你说海是蓝的\n我说海是咸的\n我们都没说错'}
        />
        <label>封面渐变 art（或填下方封面图 URL）</label>
        <input value={editing.art || ''} onChange={(e) => setEditing({ ...editing, art: e.target.value })} placeholder="linear-gradient(180deg,…)" />
        <label>海面渐变 sea</label>
        <input value={editing.sea || ''} onChange={(e) => setEditing({ ...editing, sea: e.target.value })} />
        <label>封面图 URL（R2，可选，优先于渐变）</label>
        <input value={editing.cover_url || ''} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} />
        <label>状态（⚠ 本表用 draft / published）</label>
        <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
          <option value="draft">draft</option><option value="published">published</option>
        </select>
        <label>涨潮字幕（每行：时机 空格 文字，【】包强调段）</label>
        <textarea rows={10} value={beatsText} onChange={(e) => setBeatsText(e.target.value)}
          placeholder={'0 一九八六年的夏天，他在东山岛的渡口，等一班始终没有来的船。\n0.58 老人听完只说，这调子【像涨潮】。后来这三个字成了歌名。'} />
        <div className="form-msg">{msg}</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn" onClick={save}>保存</button>
          <button className="btn ghost" onClick={() => setEditing(null)}>取消</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: 14 }}>
        <button className="btn small" onClick={() => openEdit(null)}>新建歌曲</button>
      </div>
      <table className="admin-table">
        <thead><tr><th>歌名</th><th>音乐人</th><th>来处</th><th>状态</th><th></th></tr></thead>
        <tbody>
          {tracks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}<span style={{ color: 'var(--ink-soft)', marginLeft: 8, fontStyle: 'italic' }}>{t.title_en}</span></td>
              <td>{t.cove_musicians?.name || ''}</td>
              <td>{t.place || ''}</td>
              <td><span className={'status-pill' + (t.status === 'published' ? ' pub' : '')}>{t.status}</span></td>
              <td><button className="btn ghost small" onClick={() => openEdit(t)}>编辑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
