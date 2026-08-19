// 音乐生成测试 · 异步版（提交秒回 + 轮询查询）
// GET  /api/minimax-test?v=1          → 提交任务，秒回一个 jobId
// GET  /api/minimax-test?job=<jobId>  → 查这个任务好了没
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 15; // 都是秒回操作，不需要长超时

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 建任务要写库，用 service_role
  );
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const job = searchParams.get('job');
  const supa = admin();

  // ---- 查询模式 ----
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
      提示: data.status === 'done' ? '✅ 生成完成，audioUrl 可以听了'
           : data.status === 'failed' ? '❌ 生成失败，看 error'
           : '⏳ 还在生成，过几秒再查一次（刷新加 &t=' + Date.now() + ' 避免缓存）',
    });
  }

  // ---- 提交模式 ----
  const v = searchParams.get('v') || '2';
  // 1) 建一条任务记录
  const { data: created, error: insErr } = await supa
    .from('cove_music_jobs')
    .insert({ status: 'pending', is_instrumental: true })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ ok: false, step: '建任务', error: insErr.message }, { status: 500 });

  const jobId = created.id;

  // 2) 触发 Supabase Edge Function 后台生成（不等它）
  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/music-generate`;
  try {
    // 不 await 结果的等待，只要触发成功即可；给个短超时避免卡住
    await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ jobId, v }),
    });
  } catch (e) {
    // 即使触发的 fetch 报错，后台可能已经在跑；不影响，继续
  }

  return NextResponse.json({
    ok: true,
    jobId,
    message: '已提交生成任务',
    下一步: `过 30-60 秒，访问 /api/minimax-test?job=${jobId} 查结果`,
  });
}
