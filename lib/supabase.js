import { createClient } from '@supabase/supabase-js';

// 环境变量在 Vercel 项目设置里配：
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 把 curation + tracks + beats 组装成前端沉浸页要的数据形状
// （与 data 层的 issueVII 结构完全一致，组件零改动）
export async function fetchIssue(id) {
  const { data: cur, error } = await supabase
    .from('cove_curations').select('*').eq('id', id)
    .eq('status', 'published').single();
  if (error || !cur) return null;

  const { data: tracks } = await supabase
    .from('cove_tracks')
    .select('*, cove_musicians(name, name_en)')
    .in('id', cur.track_ids);

  const { data: beats } = await supabase
    .from('cove_beats').select('*')
    .in('track_id', cur.track_ids).order('ord');

  // 按 track_ids 原序排列，并挂上各自的 beats
  const ordered = cur.track_ids
    .map((tid) => tracks?.find((t) => t.id === tid))
    .filter(Boolean)
    .map((t) => ({
      ...t,
      en: t.title_en, cn: t.title,
      artist: t.cove_musicians?.name || '',
      beats: (beats || [])
        .filter((b) => b.track_id === t.id)
        .map((b) => ({ at: Number(b.at), segments: b.segments })),
    }));

  return { ...cur, tracks: ordered };
}
