// AI 小样生成 · 服务端代理
// Suno / Udio 没有官方公开 API，这里对接第三方代理服务（自行注册取 key）。
// 环境变量：SUNO_API_BASE（如 https://api.sunoapi.org）、SUNO_API_KEY
// 按主流第三方格式实现：POST 提交任务拿 taskId，GET 轮询拿音频。
// 换服务商只改这个文件。
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BASE = (process.env.SUNO_API_BASE || '').replace(/\/$/, '');
const KEY = process.env.SUNO_API_KEY || '';

function unconfigured() {
  return NextResponse.json(
    { error: '生成服务未接入。需要在 Vercel 配置 SUNO_API_BASE 与 SUNO_API_KEY（第三方 Suno API 服务）。' },
    { status: 503 }
  );
}

// 提交生成任务：{ title, lyrics, style }
export async function POST(req) {
  if (!BASE || !KEY) return unconfigured();
  const { title, lyrics, style } = await req.json().catch(() => ({}));
  if (!lyrics?.trim()) return NextResponse.json({ error: '没有歌词' }, { status: 400 });

  const r = await fetch(`${BASE}/api/v1/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      title: (title || '未命名').slice(0, 80),
      prompt: lyrics.slice(0, 3000),
      style: (style || 'acoustic, nylon guitar, gentle').slice(0, 200),
      model: 'V4',
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ error: j.msg || j.error || `生成服务返回 ${r.status}` }, { status: 502 });
  const taskId = j.data?.taskId || j.data?.task_id || j.taskId;
  if (!taskId) return NextResponse.json({ error: '没有拿到任务号', raw: j }, { status: 502 });
  return NextResponse.json({ taskId });
}

// 轮询任务：?taskId=xxx
export async function GET(req) {
  if (!BASE || !KEY) return unconfigured();
  const taskId = new URL(req.url).searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ error: '缺 taskId' }, { status: 400 });

  const r = await fetch(`${BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ error: j.msg || `查询失败 ${r.status}` }, { status: 502 });

  const data = j.data || {};
  const status = data.status || data.callbackType || 'PENDING';
  const items = data.response?.sunoData || data.sunoData || [];
  const audio = items.find((x) => x.audioUrl || x.audio_url);
  return NextResponse.json({
    status,
    audioUrl: audio ? (audio.audioUrl || audio.audio_url) : null,
  });
}
