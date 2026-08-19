// MiniMax 纯器乐氛围配乐 · 调优测试接口
// 访问时加 ?v=1 / ?v=2 / ?v=3 试不同风格的 prompt，都是纯器乐（无人声）
// 例：https://cove.ge/api/minimax-test?v=2
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// 三种编曲级 prompt，都针对《洱海的雨》这类克制的诗，纯器乐氛围
const PROMPTS = {
  1: {
    name: '钢琴独奏·极简留白',
    prompt: 'Solo piano, minimalist, sparse and slow, around 60 BPM, in a melancholic minor key. Long sustained notes with lots of silence between phrases, like raindrops falling on still water. Intimate, restrained, no drums, no other instruments. Contemporary classical, in the vein of Ryuichi Sakamoto and Nils Frahm. Gentle intro that lingers, a quiet middle that breathes, and a fading tail that dissolves into silence.',
  },
  2: {
    name: '钢琴+弦乐·雨天氛围',
    prompt: 'Ambient contemporary classical, solo piano with subtle string pads underneath, slow tempo around 65 BPM, minor key, melancholic and tender. The strings swell gently and recede, never overpowering the piano. Evokes rain over a lake at dusk. Spacious, unhurried, with generous silence. No percussion, no vocals. Soft dynamics, cinematic but restrained. Structure: a bare piano intro, strings entering halfway to deepen the mood, then thinning out to a quiet close.',
  },
  3: {
    name: '氛围电子·冷调空间',
    prompt: 'Ambient, atmospheric, slow and cold, sparse piano notes floating over deep warm synth pads and subtle field-textured drones. Around 55 BPM, minor key, blue and oceanic in feeling. Very spacious with long reverb tails, like mist over water. Meditative, restrained, low saturation. No beat, no vocals. In the vein of Brian Eno and Ólafur Arnalds ambient works. Slowly evolving, never resolving fully.',
  },
};

export async function GET(req) {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: '没找到 MINIMAX_API_KEY' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const v = searchParams.get('v') || '2';
  const chosen = PROMPTS[v] || PROMPTS['2'];

  const payload = {
    model: 'music-3.0',
    prompt: chosen.prompt,
    is_instrumental: true,           // 纯器乐，无人声
    lyrics_optimizer: true,          // 无歌词直接生成
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: 'mp3' },
    output_format: 'url',
  };

  try {
    const resp = await fetch('https://api.minimax.io/v1/music_generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(payload),
    });
    const text = await resp.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const baseResp = data?.base_resp || {};
    const audio = data?.data?.audio || null;

    if (baseResp.status_code === 0 && audio) {
      return NextResponse.json({
        ok: true,
        风格: chosen.name,
        message: '✅ 生成成功，把 audioUrl 复制到浏览器听（纯器乐）',
        audioUrl: audio,
        提示: '换风格：网址后面加 ?v=1 或 ?v=2 或 ?v=3',
      });
    }
    return NextResponse.json({ ok: false, 风格: chosen.name, base_resp: baseResp, fullResponse: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
