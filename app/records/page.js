import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '打捞碎月 · Cove' };

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
const roman = (n) => ROMAN[n - 1] || String(n);

const VIEWS = [
  { key: 'issues',      label: '按期' },
  { key: 'instruments', label: '按主奏乐器' },
  { key: 'musicians',   label: '按音乐人' },
];

export default async function MoonDredgePage({ searchParams }) {
  const sp = await searchParams;
  const view = ['issues', 'instruments', 'musicians'].includes(sp?.view) ? sp.view : 'issues';

  // 各期（含 track_ids 用于反查歌曲归属的期）
  const { data: issues } = await supabase
    .from('cove_curations')
    .select('id, issue_number, theme_zh, theme_en, is_special, published_at, track_ids')
    .eq('status', 'published')
    .order('issue_number', { ascending: false });

  // 已发布曲目（乐器 / 音乐人两个视图共用）
  let tracks = null;
  if (view !== 'issues') {
    const res = await supabase
      .from('cove_tracks')
      .select('id, title, title_en, lead_instrument, musician:cove_musicians(id, name, origin)')
      .eq('status', 'published')
      .order('created_at', { ascending: true });
    tracks = res.data || [];
  }

  // 歌 → 所在期 的映射（点歌跳到那一期的沉浸页）
  const trackIssue = {};
  (issues || []).forEach((it) => {
    (it.track_ids || []).forEach((tid) => { trackIssue[tid] = it; });
  });

  // 分组
  const groupBy = (arr, keyFn) => {
    const m = new Map();
    for (const x of arr) {
      const k = keyFn(x) || '未注明';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return [...m.entries()];
  };

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Moon Dredging</div>
        <div className="th">打捞碎月</div>
        <div className="sub">散落在海面的经典旧作，一期打捞几片。像在唱片行的木架前，一张一张把封套翻过去。</div>
        <div className="hairline" />
      </div>

      {/* 三维视图切换 */}
      <nav className="view-tabs">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={v.key === 'issues' ? '/records' : `/records?view=${v.key}`}
            className={view === v.key ? 'on' : ''}
          >
            {v.label}
          </Link>
        ))}
      </nav>

      {/* 视图一：按期 */}
      {view === 'issues' && (
        issues && issues.length > 0 ? (
          <div className="shelf">
            {issues.map((it) => (
              <Link key={it.id} href={`/records/${it.id}`}>
                <span className="no">No. {roman(it.issue_number)}</span>
                <span className="th">{it.theme_zh}</span>
                {it.theme_en ? <span className="en">{it.theme_en}</span> : null}
                {it.is_special ? <span className="special">特刊</span> : null}
                <span className="date">
                  {it.published_at ? new Date(it.published_at).toLocaleDateString('zh-CN') : ''}
                </span>
              </Link>
            ))}
          </div>
        ) : null
      )}

      {/* 视图二：按主奏乐器 */}
      {view === 'instruments' && tracks && (
        <div className="grouped">
          {groupBy(tracks, (t) => t.lead_instrument).map(([inst, list]) => (
            <section key={inst} className="group">
              <h3 className="group-name">{inst}</h3>
              <ul className="group-list">
                {list.map((t) => {
                  const issue = trackIssue[t.id];
                  return (
                    <li key={t.id}>
                      {issue ? (
                        <Link href={`/records/${issue.id}`}>
                          <span className="t-title">{t.title}</span>
                          {t.title_en ? <span className="t-en">{t.title_en}</span> : null}
                          <span className="t-meta">{t.musician?.name}｜No. {roman(issue.issue_number)}《{issue.theme_zh}》</span>
                        </Link>
                      ) : (
                        <span className="t-plain">
                          <span className="t-title">{t.title}</span>
                          <span className="t-meta">{t.musician?.name}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* 视图三：按音乐人 */}
      {view === 'musicians' && tracks && (
        <div className="grouped">
          {groupBy(tracks, (t) => t.musician?.name).map(([name, list]) => (
            <section key={name} className="group">
              <h3 className="group-name">
                {name}
                {list[0]?.musician?.origin ? <span className="group-sub">{list[0].musician.origin}</span> : null}
              </h3>
              <ul className="group-list">
                {list.map((t) => {
                  const issue = trackIssue[t.id];
                  return (
                    <li key={t.id}>
                      {issue ? (
                        <Link href={`/records/${issue.id}`}>
                          <span className="t-title">{t.title}</span>
                          {t.lead_instrument ? <span className="t-en">{t.lead_instrument}</span> : null}
                          <span className="t-meta">No. {roman(issue.issue_number)}《{issue.theme_zh}》</span>
                        </Link>
                      ) : (
                        <span className="t-plain"><span className="t-title">{t.title}</span></span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="dredging">下一期还在打捞中</p>
    </main>
  );
}
