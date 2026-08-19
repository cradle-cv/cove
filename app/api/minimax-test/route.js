// MiniMax 音乐生成 · 最小验证接口
// 作用：访问这个接口，后端用《洱海的雨》调 MiniMax 生成一段音乐，返回结果。
// 只是验证 key 能不能用、音乐能不能生成。验证通过后会删掉这个文件。
// key 放 Vercel 环境变量 MINIMAX_API_KEY，代码里不含真实 key。
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 音乐生成较慢，放宽超时（Vercel 上限依套餐而定）

export async function GET() {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, step: '环境变量', error: '没找到 MINIMAX_API_KEY，请在 Vercel 环境变量里配置' },
      { status: 500 }
    );
  }

  const payload = {
    model: 'music-3.0',
    prompt: '安静克制的中文独立音乐，钢琴与弦乐，雨天海边的氛围，缓慢，留白，忧郁而温柔，低饱和度的情绪',
    lyrics: [
      '夏天的雨落在洱海上',
      '那是深蓝色',
      '扑进另一种蓝色里',
      '没有声音',
      '打伞的人站在岸边',
      '等一场雨停',
      '海却没有等',
      '它把雨都收下了',
    ].join('\n'),
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
    output_format: 'url',
  };

  try {
    const resp = await fetch('https://api.minimax.io/v1/music_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // MiniMax 成功时 base_resp.status_code === 0
    const baseResp = data?.base_resp || {};
    const audio = data?.data?.audio || null;

    if (baseResp.status_code === 0 && audio) {
      return NextResponse.json({
        ok: true,
        message: '✅ 成功！音乐生成了。把下面的 audioUrl 复制到浏览器就能听。',
        audioUrl: audio,
        httpStatus: resp.status,
      });
    }

    // 失败：把错误信息带回来，方便排查
    return NextResponse.json({
      ok: false,
      message: '⚠️ 没成功，看下面的信息排查',
      httpStatus: resp.status,
      base_resp: baseResp,
      fullResponse: data,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, step: '请求异常', error: String(e) },
      { status: 500 }
    );
  }
}
