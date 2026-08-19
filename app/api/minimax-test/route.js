// 音乐生成测试 · 支持自己传 prompt
// 提交（用自己的提示词）：/api/minimax-test?p=你的英文或中文提示词
// 提交（用预设）：      /api/minimax-test?v=1
// 查结果：              /api/minimax-test?job=<jobId>
// 看最近任务列表：      /api/minimax-test?list=1
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
  const supa = admin();

  // ---- 列表模式：看最近 10 个任务，方便找回结果 ----
  if (searchParams.get('list')) {
    const { data } = await supa
      .from('cove_music_jobs')
      .select('id, status, audio_url, prompt, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    return NextResponse.json({ ok: true, 任务列表: data });
  }

  // ---- 查询模式 ----
  const job = searchParams.get('job');
  if (job) {
    const { data, error } = await supa
      .from('cove_music_jobs')
      .select('id, status, audio_url, error, prompt')
      .eq('id', job)
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      status: data.status,
      audioUrl: data.audio_url,
      用的提示词: data.prompt,
      error: data.error,
      提示: data.status === 'done' ? '✅ 完成' : data.status === 'failed' ? '❌ 失败' : '⏳ 生成中，过几秒再查',
    });
  }

  // ---- 提交模式 ----
  const customPrompt = searchParams.get('p');   // 你自己的提示词
  const v = searchParams.get('v') || '1';

  const { data: created, error: insErr } = await supa
    .from('cove_music_jobs')
    .insert({ status: 'pending', is_instrumental: true, prompt: customPrompt || null })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ ok: false, step: '建任务', error: insErr.message }, { status: 500 });
  const jobId = created.id;

  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/music-generate`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 3000);
  try {
    await fetch(fnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ jobId, v, prompt: customPrompt || undefined }),
      signal: controller.signal,
    });
  } catch (e) {
    // 预期的断开，Edge Function 继续跑
  } finally {
    clearTimeout(t);
  }

  return NextResponse.json({
    ok: true,
    jobId,
    用的提示词: customPrompt || `预设 v=${v}`,
    下一步: `过 60-90 秒查：/api/minimax-test?job=${jobId}`,
    小抄: '自己传提示词：/api/minimax-test?p=你的提示词（用英文效果通常更好）｜看所有任务：/api/minimax-test?list=1',
  });
}
