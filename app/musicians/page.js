import { supabase } from '@/lib/supabase';

export const revalidate = 300;
export const metadata = { title: '音乐人 · Seacove' };

// 分两组：入驻的音乐人（is_resident = true）与打捞碎月收录过歌的歌手。
// is_resident 这一列由 supabase/migrations/003_musician_resident.sql 加上，
// 迁移未执行时查询会报错（列不存在），此时退回原来的单列表。
async function loadMusicians() {
  const withFlag = await supabase
    .from('cove_musicians')
    .select('id, name, name_en, origin, is_resident')
    .eq('status', 'active')
    .order('created_at');
  if (!withFlag.error) return { list: withFlag.data || [], grouped: true };

  const plain = await supabase
    .from('cove_musicians')
    .select('id, name, name_en, origin')
    .eq('status', 'active')
    .order('created_at');
  return { list: plain.data || [], grouped: false };
}

function Shelf({ list }) {
  return (
    <div className="shelf">
      {list.map((m) => (
        <a key={m.id} href={`/musicians/${m.id}`}>
          <span className="th">{m.name}</span>
          {m.name_en ? <span className="en">{m.name_en}</span> : null}
          <span className="date">{m.origin || ''}</span>
        </a>
      ))}
    </div>
  );
}

export default async function MusiciansPage() {
  const { list, grouped } = await loadMusicians();
  const residents = grouped ? list.filter((m) => m.is_resident) : [];
  const collected = grouped ? list.filter((m) => !m.is_resident) : [];

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Musicians</div>
        <div className="th">音乐人</div>
        <div className="sub">在海角停靠过的人。有人写歌，有人唱歌，有人只是路过听了很久。</div>
        <div className="hairline" />
      </div>

      {grouped ? (
        <>
          {residents.length > 0 ? (
            <section className="musician-group">
              <h3>入驻的音乐人</h3>
              <Shelf list={residents} />
            </section>
          ) : null}
          {collected.length > 0 ? (
            <section className="musician-group">
              <h3>打捞碎月收录过的歌手</h3>
              <p className="group-note">
                这一组是在打捞碎月某一期里出现过的歌手，他们的歌被收进那一期，连同来历一起讲过一遍。
              </p>
              <Shelf list={collected} />
            </section>
          ) : null}
        </>
      ) : list.length > 0 ? (
        <Shelf list={list} />
      ) : null}

      <p className="dredging">名单还很短，海很大</p>
    </main>
  );
}
