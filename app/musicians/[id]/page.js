import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;

// ⚠ Next.js 16：params 是 Promise，必须 await
export default async function MusicianPage({ params }) {
  const { id } = await params;
  const { data: m } = await supabase
    .from('cove_musicians').select('*')
    .eq('id', id).eq('status', 'active')
    .maybeSingle();
  if (!m) notFound();

  const { data: tracks } = await supabase
    .from('cove_tracks').select('id, title, title_en, place')
    .eq('musician_id', id).eq('status', 'published');

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">{m.name_en || ''}</div>
        <div className="th">{m.name}</div>
        {m.origin ? <div className="sub">{m.origin}</div> : null}
        {m.bio ? <div className="sub">{m.bio}</div> : null}
        <div className="hairline" />
      </div>
      {tracks && tracks.length > 0 ? (
        <div className="shelf">
          {tracks.map((t) => (
            <a key={t.id} href="/records">
              <span className="th">{t.title}</span>
              <span className="en">{t.title_en}</span>
              <span className="date">{t.place || ''}</span>
            </a>
          ))}
        </div>
      ) : null}
    </main>
  );
}
