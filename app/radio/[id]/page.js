import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

// ⚠ Next.js 16：params 是 Promise，必须 await
export default async function EpisodePage({ params }) {
  const { id } = await params;
  const { data: ep } = await supabase
    .from('cove_interviews')
    .select('*, cove_musicians(name, origin)')
    .eq('id', id).eq('status', 'published')
    .maybeSingle();
  if (!ep) notFound();

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">{ep.host || '海角电台'}</div>
        <div className="th">{ep.title}</div>
        {ep.cove_musicians?.name ? (
          <div className="sub">对话 {ep.cove_musicians.name}{ep.cove_musicians.origin ? ` · ${ep.cove_musicians.origin}` : ''}</div>
        ) : null}
        {ep.summary ? <div className="sub">{ep.summary}</div> : null}
        <div className="hairline" />
      </div>
      <div className="sub" style={{ whiteSpace: 'pre-wrap', lineHeight: 2.1, maxWidth: 640, margin: '0 auto', color: 'var(--ink)' }}>
        {ep.body}
      </div>
    </main>
  );
}
