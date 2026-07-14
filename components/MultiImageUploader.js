'use client';
// 多图上传 · 直传 R2
// 选一张或多张 → 逐个校验上传 → 返回链接数组。可删除、可继续加。
import { useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;

export default function MultiImageUploader({ value = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const inputRef = useRef(null);
  const images = Array.isArray(value) ? value : [];

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setMsg(''); setBusy(true);
    const added = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) { setMsg(`${file.name} 超过 5MB，已跳过`); continue; }
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { setMsg(`${file.name} 格式不支持，已跳过`); continue; }
      try {
        const r = await fetch('/api/upload-url', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || '申请失败');
        await put(j.uploadUrl, file, file.type);
        added.push(j.publicUrl);
      } catch (err) {
        setMsg(err.message || '有一张没传上去');
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
    if (added.length) onChange?.([...images, ...added]);
  };

  const remove = (url) => onChange?.(images.filter((u) => u !== url));

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        multiple onChange={pick} hidden />

      <div className="mi-grid">
        {images.map((url) => (
          <div key={url} className="mi-thumb">
            <img src={url} alt="" />
            <button type="button" className="mi-del" onClick={() => remove(url)} aria-label="删除">×</button>
          </div>
        ))}
        <button type="button" className="mi-add" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? '上传中…' : '＋ 加图片'}
        </button>
      </div>
      <div className="mi-hint">
        可一次选多张。jpg / png / webp，每张 5MB 以内。适量就好。
        {msg ? <span className="mi-msg"> · {msg}</span> : null}
      </div>
    </div>
  );
}

function put(url, file, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`上传失败 ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send(file);
  });
}
