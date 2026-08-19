// 音乐生成测试 · Vercel 转发到 Supabase Edge Function
// 浏览器 → cove.ge/api/minimax-test（国内能连）
//   → 本接口转发给 Supabase Edge Function music-test（Vercel到Supabase，国外到国外，通）
//   → Supabase 等 MiniMax 生成（有150秒，够）→ 结果原路返回
// 这样浏览器不用直连 Supabase，绕开国内访问 supabase.co 的问题。
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel 只是转发，真正的等待在 Supabase，通常很快返回

export async function GET(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ ok: false, error: '缺少 Supabase 环境变量' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const v = searchParams.get('v') || '2';

  const fnUrl = `${supabaseUrl}/functions/v1/music-test?v=${encodeURIComponent(v)}`;

  try {
    const resp = await fetch(fnUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    return NextResponse.json(data, { status: resp.ok ? 200 : resp.status });
  } catch (e) {
    return NextResponse.json({ ok: false, step: 'Vercel转发', error: String(e) }, { status: 500 });
  }
}
