'use client';
// 音频上传 · 直传 R2 + 波形解析
// 1) 校验：≤10MB，mp3/webm/ogg
// 2) 向 /api/upload-url 换一个预签名 URL
// 3) PUT 直传 R2（不经过我们的服务器）
// 4) 本地用 Web Audio API 解析出 200 个峰值，交给父组件存进数据库
import { useRef, useState, useEffect } from 'react';

const MAX_BYTES = 10 * 1024 * 1024;
const PEAKS = 200;

// 把 AudioBuffer 压成 PEAKS 个归一化峰值
function extractPeaks(buffer, n = PEAKS) {
  const ch = buffer.getChannelData(0);
  const block = Math.floor(ch.length / n);
  const peaks = [];
  let max = 0;
  for (let i = 0; i < n; i++) {
    let peak = 0;
    const start = i * block;
    for (let j = 0; j < block; j += 8) {
      const v = Math.abs(ch[start + j] || 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  return max > 0 ? peaks.map((p) => Math.round((p / max) * 1000) / 1000) : peaks;
}

export default function AudioUploader({ value, waveform, onDone }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const inputRef = useRef(null);
  const canvasRef = useRef(null);

  // 画波形预览
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !Array.isArray(waveform) || waveform.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const barW = w / waveform.length;
    ctx.fillStyle = '#5D9A8F';
    waveform.forEach((p, i) => {
      const bh = Math.max(1.5, p * h * 0.88);
      ctx.fillRect(i * barW, (h - bh) / 2, Math.max(1, barW - 1), bh);
    });
  }, [waveform]);

  const pick = () => inputRef.current?.click();

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(''); setPct(0);

    if (file.size > MAX_BYTES) {
      setMsg(`文件 ${(file.size / 1048576).toFixed(1)}MB，超过 10MB 上限`);
      return;
    }
    if (!/^audio\/(mpeg|mp3|webm|ogg)$/.test(file.type)) {
      setMsg('只接受 mp3 / webm / ogg');
      return;
    }

    setBusy(true);
    try {
      // 1) 换预签名 URL
      setMsg('正在申请上传许可…');
      const r = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || '申请失败');

      // 2) 并行：直传 R2 + 本地解析波形
      setMsg('正在上传…');
      const [, peaks] = await Promise.all([
        putWithProgress(j.uploadUrl, file, file.type, setPct),
        parseWaveform(file).catch(() => null),
      ]);

      setMsg('上传完成');
      onDone?.({
        url: j.publicUrl,
        waveform: peaks,
        duration: peaks?.__duration ? Math.round(peaks.__duration) : undefined,
      });
    } catch (err) {
      setMsg(err.message || '上传失败');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="uploader">
      <input ref={inputRef} type="file" accept="audio/mpeg,audio/webm,audio/ogg" onChange={handle} hidden />

      <div className="up-row">
        <button type="button" className="up-btn" onClick={pick} disabled={busy}>
          {busy ? '上传中…' : value ? '换一个音频' : '选择音频文件'}
        </button>
        <span className="up-limit">mp3 / webm / ogg，10MB 以内</span>
      </div>

      {busy ? (
        <div className="up-bar"><i style={{ width: `${pct}%` }} /></div>
      ) : null}

      {msg ? <p className="up-msg">{msg}</p> : null}

      {Array.isArray(waveform) && waveform.length > 0 ? (
        <div className="up-wave">
          <canvas ref={canvasRef} />
        </div>
      ) : null}

      {value ? <p className="up-url" title={value}>{value}</p> : null}
    </div>
  );
}

// 带进度的 PUT（fetch 没有上传进度，用 XHR）
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

// 本地解析波形（不上传，纯浏览器）
async function parseWaveform(file) {
  const buf = await file.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const audio = await ctx.decodeAudioData(buf);
  const peaks = extractPeaks(audio);
  peaks.__duration = audio.duration;
  ctx.close?.();
  return peaks;
}
