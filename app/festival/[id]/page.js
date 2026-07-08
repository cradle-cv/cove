import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SubmitForm from './SubmitForm';

export const revalidate = 120;

// ⚠ Next.js 16：params 是 Promise，必须 await
export default async function FestivalDetailPage({ params }) {
  const { id } = await params;
  const { data: f } = await supabase
    .from('cove_festivals')
    .select('*')
    .eq('id', id)
    .in('status', ['open', 'locked', 'completed'])
    .maybeSingle();
  if (!f) notFound();

  const roles = Array.isArray(f.roles_needed) ? f.roles_needed : [];
  const beforeDeadline = f.deadline ? new Date(f.deadline) > new Date() : false;
  const stateLine =
    f.status === 'completed' ? '这场演出已经成行。'
    : f.status === 'locked' || !beforeDeadline ? '报名已截稿，名单交给海。'
    : `召集中 · ${new Date(f.deadline).toLocaleDateString('zh-CN')} 截稿，截稿前报名可随时修改。`;

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Invitation</div>
        <div className="th">{f.title}</div>
        <div className="sub">
          {f.venue}{f.show_date ? ` · ${new Date(f.show_date).toLocaleDateString('zh-CN')}` : ''}
        </div>
        <div className="hairline" />
      </div>

      <div className="sub" style={{ whiteSpace: 'pre-wrap', lineHeight: 2, maxWidth: 620, margin: '0 auto 36px', textAlign: 'center', color: 'var(--ink)' }}>
        {f.brief}
      </div>

      {roles.length > 0 ? (
        <div style={{ maxWidth: 560, borderBottom: '1px solid var(--hair)', margin: '0 auto' }}>
          {roles.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 20, padding: '18px 8px', borderTop: '1px solid var(--hair)' }}>
              <span className="th">{r.role}</span>
              <span className="date" style={{ marginLeft: 'auto' }}>尚缺 {r.count} 位</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="dredging">{stateLine}</p>
      <SubmitForm festival={f} />
    </main>
  );
}
