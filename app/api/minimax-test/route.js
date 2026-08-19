// 音乐生成测试 · 异步版 v2（触发用"发射后不管"，Edge Function 同步生成）
// GET ?v=1          → 建任务 + 发射触发（不等生成），秒回 jobId
// GET ?job=<jobId>  → 查状态
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 15;

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const job = searchParams.get('job');
  const supa = admin();

  // 查询模式
  if (job) {
    const { data, error } = await supa
      .from('cove_music_jobs')
      .select('id, status, audio_url, error')
      .eq('id', job)
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      status: data.status,
      audioUrl: data.audio_url,
      error: data.error,
      提示: data.status === 'done' ? '✅ 完成，audioUrl 可以听'
           : data.status === 'failed' ? '❌ 失败，看 error'
           : '⏳ 生成中，过几秒再查',
    });
  }

  // 提交模式
  const v = searchParams.get('v') || '2';
  const { data: created, error: insErr } = await supa
    .from('cove_music_jobs')
    .insert({ status: 'pending', is_instrumental: true })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ ok: false, step: '建任务', error: insErr.message }, { status: 500 });
  const jobId = created.id;

  // 发射触发 Edge Function：不等它完整响应，2秒后就放手（生成在 Supabase 那边继续同步跑）
  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/music-generate`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 2000); // 2秒后断开，但 Edge Function 已经在跑了
  try {
    await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ jobId, v }),
      signal: controller.signal,
    });
  } catch (e) {
    // abort 是预期的（我们故意2秒断开），Edge Function 那边不受影响继续跑
  } finally {
    clearTimeout(t);
  }

  return NextResponse.json({
    ok: true,
    jobId,
    message: '已提交，Edge Function 正在生成',
    下一步: `过 40-70 秒，访问 /api/minimax-test?job=${jobId} 查结果`,
  });
}
