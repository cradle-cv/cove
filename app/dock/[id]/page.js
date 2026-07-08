import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import WorkPlayer from './WorkPlayer';

export const revalidate = 300;

// ⚠ Next.js 16：params 是 Promise，必须 await
export default async function WorkPage({ params }) {
  const { id } = await params;
  const { data: w } = await supabase
    .from('cove_works')
    .select('*, cove_musicians(name, origin)')
    .eq('id', id).eq('status', 'published')
    .maybeSingle();
  if (!w) notFound();

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">{w.cove_musicians?.name}</div>
        <div className="th">{w.title}</div>
        <div className="hairline" />
      </div>
      <WorkPlayer work={w} />
      <div className="sheet-head">
        <div className="sub" style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 620, margin: '0 auto', lineHeight: 2 }}>{w.creation_note}</div>
      </div>
    </main>
  );
}
