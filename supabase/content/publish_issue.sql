-- ============================================================================
-- 海角 · 打捞碎月 发布一期（模板）
-- ============================================================================
--
-- 用法（在 Supabase 后台 SQL Editor 里）：
--   1. 把整份文件贴进去。
--   2. 只改下面「改这里」那三行：期号、是否只预览、是否设为首页。
--   3. 第一次跑时保持 dry_run = 'on'，点 Run。
--      这一遍什么都不改，结果表会列出：各表当前的 status 分布、这一期的核对清单、
--      这一期每首歌和歌手现在的状态。核对清单里只要有一行「结果」是「不通过」，就先别发布。
--   4. 核对没问题，把 dry_run 改成 'off'，再点 Run 一次。
--      这一遍会真正写库，结果表里同时列出「执行前」和「执行后」两段 status 分布，
--      以及灯塔现在亮到第几层，方便对照。正式模式下，核对清单里的「这一期状态」
--      和「首页」两行标着「执行后」，显示的是写库之后的值。
--   5. 网站页面有缓存（首页和打捞碎月 5 分钟、灯塔 5 分钟），写库后最多等 5 分钟再刷新。
--
-- 这份脚本做的事（dry_run = 'off' 时）：
--   a. cove_curations：这一期 status 改为 'published'，published_at 若为空就写入当前时间
--      （已经有发布时间的不覆盖，方便提前在后台填好想要的日期）。
--   b. cove_tracks：这一期 track_ids 里的每首歌 status 改为 'published'。
--   c. cove_musicians：这些歌的歌手 status 改为 'active'（原来是 'hidden' 的才会变）。
--   d. 如果 set_featured = 'on'：先把所有期的 is_featured 清掉，再把这一期设为首页
--      （表上有「只能有一期是首页」的唯一索引，所以必须先清后设）。
--      如果 set_featured = 'off'：不动首页设置。注意第 1 期目前勾着「显示在首页」，
--      不把它换掉的话，新发布的期不会出现在首页信封里。
--
-- 安全设计：
--   - 写库部分是一个 do 块，要么全部成功，要么全部不生效。
--   - 写库之前会再检查一遍：期号存在、track_ids 非空、每首歌都在库里、
--     每首歌要么有站内音源（src）要么有外链（external_links），每首歌都有歌手；
--     任何一项不满足就报错停下，数据库不会被改动。
--   - 字幕（cove_beats）少于 6 段只提示，不拦截。
--   - 状态值按线上实际的约束写：曲目和期 'draft'/'published'，歌手 'active'/'hidden'。
--
-- 这份脚本不碰：电台、邻港、灯塔各层文字、每日演出、漂流瓶。
-- ============================================================================


-- ───── 改这里 ─────────────────────────────────────────────────────────────
select set_config('cove.issue_no',     '3',   false);  -- 要发布的期号
select set_config('cove.dry_run',      'on',  false);  -- 'on' 只预览不写库；确认后改 'off'
select set_config('cove.set_featured', 'on',  false);  -- 'on' 把这一期设为首页；'off' 不动首页
-- ─────────────────────────────────────────────────────────────────────────


-- 1. 记下执行前的 status 分布（README 的规矩：动数据前先看各表状态）
drop table if exists pg_temp._cove_before;   -- 带 pg_temp 前缀，只会删本次会话的临时表，碰不到 public 下的同名表
create temp table _cove_before as
  select 'cove_curations'::text as tbl, coalesce(status, '(空)') as status, count(*)::int as n
    from public.cove_curations group by status
  union all
  select 'cove_tracks', coalesce(status, '(空)'), count(*)::int
    from public.cove_tracks group by status
  union all
  select 'cove_musicians', coalesce(status, '(空)'), count(*)::int
    from public.cove_musicians group by status;


-- 2. 写库（dry_run = 'on' 时整段跳过）
do $$
declare
  v_issue     int     := current_setting('cove.issue_no')::int;
  v_dry       boolean := current_setting('cove.dry_run') = 'on';
  v_feature   boolean := current_setting('cove.set_featured') = 'on';
  v_cur       public.cove_curations%rowtype;
  v_missing   int;
  v_nosource  int;
  v_noartist  int;
  v_thinbeats int;
  v_problem   text;
begin
  -- 逐项核对。发现问题时：预览模式只提示（让下面的结果表照常显示），正式模式报错停下。
  select * into v_cur from public.cove_curations where issue_number = v_issue;

  if not found then
    v_problem := format('第 %s 期不存在，先在后台或内容 SQL 里建好这一期', v_issue);
  elsif v_cur.track_ids is null or cardinality(v_cur.track_ids) = 0 then
    v_problem := format('第 %s 期没有选曲（track_ids 为空）', v_issue);
  else
    select count(*) into v_missing
      from unnest(v_cur.track_ids) as tid
     where not exists (select 1 from public.cove_tracks t where t.id = tid);

    select count(*) into v_nosource
      from public.cove_tracks t
     where t.id = any (v_cur.track_ids)
       and coalesce(jsonb_array_length(case when jsonb_typeof(t.src) = 'array' then t.src end), 0) = 0
       and coalesce(jsonb_array_length(case when jsonb_typeof(t.external_links) = 'array' then t.external_links end), 0) = 0;

    select count(*) into v_noartist
      from public.cove_tracks t
     where t.id = any (v_cur.track_ids) and t.musician_id is null;

    select count(*) into v_thinbeats
      from public.cove_tracks t
     where t.id = any (v_cur.track_ids)
       and (select count(*) from public.cove_beats b where b.track_id = t.id) < 6;

    if v_missing > 0 then
      v_problem := format('第 %s 期的 track_ids 里有 %s 首歌在 cove_tracks 里找不到', v_issue, v_missing);
    elsif v_nosource > 0 then
      v_problem := format('第 %s 期有 %s 首歌既没有站内音源也没有外链', v_issue, v_nosource);
    elsif v_noartist > 0 then
      v_problem := format('第 %s 期有 %s 首歌没有关联歌手（musician_id 为空）', v_issue, v_noartist);
    end if;

    if v_thinbeats > 0 then
      raise notice '提示：第 % 期有 % 首歌的涨潮字幕少于 6 段', v_issue, v_thinbeats;
    end if;
  end if;

  if v_problem is not null then
    if v_dry then
      raise notice '核对不通过：%。没有写库，看结果表里的「不通过」行。', v_problem;
      return;
    end if;
    raise exception '核对不通过：%。数据库没有被改动。', v_problem;
  end if;

  if v_dry then
    raise notice '预览模式：第 % 期核对通过，没有写库。确认后把 dry_run 改成 off 再跑一次。', v_issue;
    return;
  end if;

  -- a. 期
  update public.cove_curations
     set status = 'published',
         published_at = coalesce(published_at, now())
   where id = v_cur.id;

  -- b. 歌
  update public.cove_tracks
     set status = 'published'
   where id = any (v_cur.track_ids)
     and status is distinct from 'published';

  -- c. 歌手
  update public.cove_musicians m
     set status = 'active'
   where m.id in (select t.musician_id from public.cove_tracks t where t.id = any (v_cur.track_ids))
     and m.status is distinct from 'active';

  -- d. 首页
  if v_feature then
    update public.cove_curations set is_featured = false where is_featured and id <> v_cur.id;
    update public.cove_curations set is_featured = true  where id = v_cur.id;
  end if;

  raise notice '第 % 期已发布。', v_issue;
end
$$;


-- 3. 结果表（SQL Editor 只显示最后一个查询的结果，所以所有要看的东西都并在这一张表里）
with
p as (
  select current_setting('cove.issue_no')::int as issue_no,
         current_setting('cove.dry_run') = 'on' as dry
),
cur as (
  select c.* from public.cove_curations c, p where c.issue_number = p.issue_no
),
tr as (
  select t.id, t.title, t.status, t.src, t.external_links, t.musician_id,
         m.name as artist, m.status as artist_status,
         (select count(*) from public.cove_beats b where b.track_id = t.id) as beats,
         array_position(cur.track_ids, t.id) as pos
    from cur
    join public.cove_tracks t on t.id = any (cur.track_ids)
    left join public.cove_musicians m on m.id = t.musician_id
),
after_dist as (
  select 'cove_curations'::text as tbl, coalesce(status, '(空)') as status, count(*)::int as n
    from public.cove_curations group by status
  union all
  select 'cove_tracks', coalesce(status, '(空)'), count(*)::int
    from public.cove_tracks group by status
  union all
  select 'cove_musicians', coalesce(status, '(空)'), count(*)::int
    from public.cove_musicians group by status
),
lit as (
  select count(*) as floors
    from public.cove_lighthouse_zones z
   where (select count(*) from public.cove_curations where status = 'published') >= coalesce(z.unlock_after, 0)
),
rows as (
  -- 执行前的分布
  select 10 as sec, tbl || ' / ' || status as k, n::text as v, '' as verdict, 0 as ord
    from pg_temp._cove_before
  -- 核对清单
  union all
  select 20, '这一期是否存在',
         coalesce((select '第 ' || issue_number || ' 期《' || coalesce(theme_zh, '') || '》' from cur), '找不到'),
         case when exists (select 1 from cur) then '通过' else '不通过' end, 1
  union all
  select 20, case when (select dry from p) then '这一期状态（当前）' else '这一期状态（执行后）' end,
         coalesce((select status || '，发布时间 ' || coalesce(published_at::text, '(空)') from cur), '-'),
         '', 2
  union all
  select 20, '选曲数（track_ids）',
         coalesce((select cardinality(track_ids)::text from cur), '0'),
         case when coalesce((select cardinality(track_ids) from cur), 0) > 0 then '通过' else '不通过' end, 3
  union all
  select 20, '库里找得到的歌',
         (select count(*)::text from tr),
         case when (select count(*) from tr) = coalesce((select cardinality(track_ids) from cur), -1) then '通过' else '不通过' end, 4
  union all
  select 20, case when (select dry from p) then '首页 is_featured（当前）' else '首页 is_featured（执行后）' end,
         coalesce((select string_agg('第 ' || issue_number || ' 期', '、') from public.cove_curations where is_featured), '无'),
         '', 5
  union all
  -- 每首歌一行
  select 30,
         tr.pos || '. ' || tr.title || ' / ' || coalesce(tr.artist, '(无歌手)'),
         '歌:' || coalesce(tr.status, '(空)')
           || '  歌手:' || coalesce(tr.artist_status, '(空)')
           || '  字幕:' || tr.beats || '段'
           || '  音源:' || case
                when jsonb_typeof(tr.src) = 'array' and jsonb_array_length(tr.src) > 0 then '站内'
                when jsonb_typeof(tr.external_links) = 'array' and jsonb_array_length(tr.external_links) > 0
                  then '外链 ' || jsonb_array_length(tr.external_links) || ' 个'
                else '无' end,
         case
           when tr.musician_id is null then '不通过'
           when not (   (jsonb_typeof(tr.src) = 'array' and jsonb_array_length(tr.src) > 0)
                     or (jsonb_typeof(tr.external_links) = 'array' and jsonb_array_length(tr.external_links) > 0)) then '不通过'
           when tr.beats < 6 then '提示'
           else '通过' end,
         tr.pos
    from tr
  -- 执行后的分布（预览模式下与执行前相同）
  union all
  select 40, tbl || ' / ' || status, n::text, '', 0 from after_dist
  union all
  select 50, '灯塔点亮层数', (select floors::text from lit), '', 0
)
select case sec
         when 10 then '① 执行前 status 分布'
         when 20 then '② 核对清单'
         when 30 then '③ 本期曲目'
         when 40 then case when (select dry from p) then '④ 当前 status 分布（预览，未写库）'
                           else '④ 执行后 status 分布' end
         else '⑤ 灯塔'
       end as "区块",
       k as "项目",
       v as "值",
       verdict as "结果"
  from rows
 order by sec, ord, k;
