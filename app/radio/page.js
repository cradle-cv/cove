import { supabase } from '@/lib/supabase';
import RadioTuner from './RadioTuner';

export const revalidate = 300;
export const metadata = { title: '海角电台 · Cove' };

// 电台不是列表，是一个频段。每期专访占一个频点，
// 拖动指针调台，信号锁定时节目浮现。
export default async function RadioPage() {
  const { data: list } = await supabase
    .from('cove_interviews')
    .select('id, episode_no, title, summary, published_at, cove_musicians(name)')
    .eq('status', 'published')
    .order('episode_no', { ascending: true });

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Cove FM</div>
        <div className="th">海角电台</div>
        <div className="sub">
          主持人和一位音乐人，一个下午，一段不赶时间的对话。<br />
          海角电台没有节目单——只在你调到它的时候存在。
        </div>
        <div className="hairline" />
      </div>

      <RadioTuner episodes={list || []} />
    </main>
  );
}
