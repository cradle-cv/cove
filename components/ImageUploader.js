'use client';
// 图片上传 · 直传 R2
// 选图 → 校验（≤5MB，jpg/png/webp/gif）→ 换预签名 URL → PUT 直传 → 回传公开链接。
// 用于头像等，圆形预览。
import { useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageUploader({ value, onDone, shape = 'circle' }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const inputRef = useRef(null);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(''); setPct(0);

    if (file.size > MAX_BYTES) {
      setMsg(`图片 ${(file.size / 1048576).toFixed(1)}MB，超过 5MB`);
      return;
    }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setMsg('只接受 jpg / png / webp / gif');
      return;
    }

    setBusy(true);
    try {
      const r = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '申请失败');
      await putWithProgress(j.uploadUrl, file, file.type, setPct);
      onDone?.({ url: j.publicUrl });
      setMsg('');
    } catch (err) {
      setMsg(err.message || '上传失败');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const radius = shape === 'circle' ? '50%' : '10px';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handle} hidden />
      <div
        onClick={() => !busy && inputRef.current?.click()}
        style={{
          width: 76, height: 76, borderRadius: radius, flex: '0 0 auto', cursor: busy ? 'default' : 'pointer',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(93,154,143,.18)', border: '1px solid var(--hair)',
          color: 'var(--ink-soft)', fontSize: 11, textAlign: 'center', letterSpacing: '.04em',
        }}
      >
        {value ? (
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : busy ? `${pct}%` : '选择图片'}
      </div>
      <div>
        <button type="button" className="btn ghost small" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? '上传中…' : value ? '换一张' : '上传头像'}
        </button>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 6, fontWeight: 300 }}>
          jpg / png / webp，5MB 以内
        </div>
        {msg ? <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>{msg}</div> : null}
      </div>
    </div>
  );
}

function putWithProgress(url, file, contentType, onPct) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`上传失败 ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send(file);
  });
}
