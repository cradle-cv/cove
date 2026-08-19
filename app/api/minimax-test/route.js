// 谱曲台后端
// ?p=提示词        → 建任务（数据库触发器会自动叫 Edge Function 生成）
// ?job=<id>        → 查状态；生成完会顺手把音频转存到 R2 变成永久链接
// ?list=1          → 我的生成记录
// ?adopt=<id>&title=名字 → 把某版采用为作品
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const maxDuration = 60; // 转存音频要下载+上传，给宽一点

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// 把 MiniMax 的临时音频转存到自己的 R2，返回永久地址
async function saveToR2(jobId, tempUrl) {
  const {
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
    R2_BUCKET = 'cove', NEXT_PUBLIC_R2_PUBLIC_URL,
  } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;

  const res = await fetch(tempUrl);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());

  const key = `covemusic/compose/${jobId}.mp3`;
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET, Key: key, Body: buf, ContentType: 'audio/mpeg',
  }));

  return `${(NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const supa = admin();

  // ---- 采用为作品 ----
  const adopt = searchParams.get('adopt');
  if (adopt) {
    const title = (searchParams.get('title') || '').trim() || null;
    const { error } = await supa
      .from('cove_music_jobs')
      .update({ adopted: true, title })
      .eq('id', adopt);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: '已采用为作品' });
  }

  // ---- 取消采用 ----
  const unadopt = searchParams.get('unadopt');
  if (unadopt) {
    await supa.from('cove_music_jobs').update({ adopted: false }).eq('id', unadopt);
    return NextResponse.json({ ok: true, message: '已取消' });
  }

  // ---- 生成记录列表 ----
  if (searchParams.get('list')) {
    const { data } = await supa
      .from('cove_music_jobs')
      .select('id, status, audio_url, r2_url, prompt, adopted, title, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    return NextResponse.json({ ok: true, 任务列表: data });
  }

  // ---- 查状态（顺手转存 R2）----
  const job = searchParams.get('job');
  if (job) {
    const { data, error } = await supa
      .from('cove_music_jobs')
      .select('id, status, audio_url, r2_url, saved, error, prompt, adopted, title')
      .eq('id', job)
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    let finalUrl = data.r2_url || data.audio_url;

    // 生成完了但还没转存 → 现在转存
    if (data.status === 'done' && data.audio_url && !data.saved) {
      try {
        const permanent = await saveToR2(data.id, data.audio_url);
        if (permanent) {
          await supa.from('cove_music_jobs')
            .update({ r2_url: permanent, saved: true })
            .eq('id', data.id);
          finalUrl = permanent;
        }
      } catch (e) {
        // 转存失败不影响听，还能用临时链接
      }
    }

    return NextResponse.json({
      ok: true,
      status: data.status,
      audioUrl: finalUrl,
      已永久保存: !!data.r2_url,
      adopted: data.adopted,
      title: data.title,
      用的提示词: data.prompt,
      error: data.error,
    });
  }

  // ---- 提交生成 ----
  const customPrompt = searchParams.get('p');
  const { data: created, error: insErr } = await supa
    .from('cove_music_jobs')
    .insert({ status: 'pending', is_instrumental: true, prompt: customPrompt || null })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ ok: false, step: '建任务', error: insErr.message }, { status: 500 });

  // 触发由数据库触发器（pg_net）自动完成
  return NextResponse.json({
    ok: true,
    jobId: created.id,
    用的提示词: customPrompt || '（默认）',
    下一步: `过 2-4 分钟查：/api/minimax-test?job=${created.id}`,
  });
}
