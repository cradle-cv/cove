-- ============================================================
-- 海角 Seacove · 数据库初始化迁移
-- 同构 Cradle 架构，表名按音乐/海洋语系命名
-- 新建独立 Supabase 项目后，在 SQL Editor 一次性执行
-- ============================================================
-- 命名映射（Cradle → Seacove）：
--   users              → users            （同构保留）
--   gallery_artists    → cove_musicians   （音乐人，status 用 'active'）
--   gallery_works      → cove_tracks      （入选歌曲，status 用 'published'）
--   gallery_curations  → cove_curations   （唱片行期刊，status 用 'draft/published'）
--   （新增）           → cove_beats       （涨潮字幕：故事分句）
--   artworks/作品集    → cove_works       （原创码头作品，status 用 'published'）
--   articles/杂志社    → cove_interviews  （海角电台专访，status 用 'published'）
--   gallery_comments   → cove_echoes      （漂流瓶：听众回声）
--   邀请函/每日一展    → cove_festivals + cove_festival_submissions
--                        （每日音乐节：制作人发邀请函召集乐手/歌手/词曲作者，
--                          沿用摇篮 Rule B：按截稿期锁定报名编辑，不按审核状态锁）
--   驻地               → cove_lighthouse_zones（灯塔：分层沉浸区，随内容积累逐层点亮）
--   partners           → cove_partners    （邻港，status 用 'active'）
--
-- ⚠ 状态值约定（沿用摇篮的教训，各表不同，插数据前先核对）：
--   cove_musicians / cove_partners      → 'active'
--   cove_tracks / cove_works / cove_interviews / cove_curations → 'draft' / 'published'
--   cove_festivals → 'draft' / 'open' / 'locked' / 'completed'
-- ============================================================

-- ---------- 0. 用户与鉴权桥接 ----------
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user','musician','admin','superadmin')),
  bio text,
  created_at timestamptz DEFAULT now()
);

-- 摇篮同款：SECURITY DEFINER 辅助函数，把 auth.uid() 映射到业务 users.id
-- （避免每条策略里都写子查询，也规避 users.id ≠ auth.uid() 的坑）
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role IN ('admin','superadmin')
  )
$$;

-- 新用户注册（auth.users 插入）时，自动创建业务 users 行
-- SECURITY DEFINER 绕过 RLS；没有这一步，登录用户过不了 current_user_id() 的策略
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, username)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
  ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------- 1. 音乐人（≈ gallery_artists，status 'active'） ----------
CREATE TABLE IF NOT EXISTS cove_musicians (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,  -- 入驻音乐人可绑定账号
  name text NOT NULL,                -- 显示名，如 林岸
  name_en text,
  origin text,                       -- 来处，如 东山岛
  bio text,
  portrait_url text,                 -- R2
  status text DEFAULT 'active' CHECK (status IN ('active','hidden')),
  created_at timestamptz DEFAULT now()
);

-- ---------- 2. 入选歌曲（≈ gallery_works，status 'published'） ----------
CREATE TABLE IF NOT EXISTS cove_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  musician_id uuid REFERENCES cove_musicians(id) ON DELETE SET NULL,
  title text NOT NULL,               -- 渡口
  title_en text,                     -- Du Kou
  place text,                        -- 东山岛 · 1986
  seal text,                         -- 印章单字，如 海
  duration integer,                  -- 秒
  src jsonb,                         -- 音频源 ['x.webm','x.mp3']，R2；外链歌留空
  external_links jsonb,              -- {netease:'',qq:''} 外链听歌
  art text,                          -- 封面渐变或图片 URL
  sea text,                          -- 海面渐变
  cover_url text,                    -- 真实专辑图（可选，优先于 art）
  status text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz DEFAULT now()
);

-- ---------- 3. 涨潮字幕：故事分句（结构化，无 HTML） ----------
CREATE TABLE IF NOT EXISTS cove_beats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES cove_tracks(id) ON DELETE CASCADE,
  ord integer NOT NULL,              -- 句序
  at numeric NOT NULL CHECK (at >= 0 AND at <= 1),  -- 浮现时机 0..1
  segments jsonb NOT NULL,           -- [{"t":"…"},{"t":"像涨潮","em":true},…]
  UNIQUE (track_id, ord)
);

-- ---------- 4. 音乐房期刊（≈ gallery_curations） ----------
CREATE TABLE IF NOT EXISTS cove_curations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_number integer UNIQUE NOT NULL,        -- 期号，前端渲染为罗马数字
  theme_en text,                               -- Crossing the Sea
  theme_zh text,                               -- 渡海的人
  intro text,                                  -- 期引言
  quote text,
  quote_author text,
  track_ids uuid[] NOT NULL,                   -- 本期 3 首 cove_tracks 的 ID，按序
  is_special boolean DEFAULT false,            -- 特刊（节气/节点）
  status text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cove_curations_pub
  ON cove_curations (status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_cove_curations_no
  ON cove_curations (issue_number DESC);

-- ---------- 5. 船坞原创作品（≈ artworks/作品集） ----------
CREATE TABLE IF NOT EXISTS cove_works (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  musician_id uuid NOT NULL REFERENCES cove_musicians(id) ON DELETE CASCADE,
  title text NOT NULL,
  audio_src jsonb,                   -- R2 双源
  cover_url text,
  creation_note text NOT NULL,       -- 创作手记：强制非空，作品与故事一体
  duration integer,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz DEFAULT now()
);

-- ---------- 6. 海角电台专访（≈ articles/杂志社，专栏在此变为专访） ----------
CREATE TABLE IF NOT EXISTS cove_interviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_no integer UNIQUE,         -- 电台期号 No. I, II…
  title text NOT NULL,               -- 如：把这首歌唱完了才走
  guest_musician_id uuid REFERENCES cove_musicians(id) ON DELETE SET NULL,
  host text,                         -- 主持人署名
  summary text,                      -- 一句话引言
  body text,                         -- 专访正文（Markdown，问答体）
  audio_src jsonb,                   -- 专访音频 R2 双源（电台的完全体）
  cover_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  published_at timestamptz
);

-- ---------- 7. 漂流瓶：听众回声（≈ gallery_comments，反社交版） ----------
CREATE TABLE IF NOT EXISTS cove_echoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id uuid NOT NULL REFERENCES cove_tracks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,  -- 可匿名
  body text NOT NULL CHECK (char_length(body) <= 60),    -- 一句话，60 字封顶
  created_at timestamptz DEFAULT now()
);
-- 设计约定：无点赞、无回复、无排序权重字段。只浮，不互动。

-- ---------- 8. 每日音乐节（≈ 摇篮邀请函体系） ----------
-- 制作人为一场演出发起邀请函，召集乐手、歌手、词曲作者。
CREATE TABLE IF NOT EXISTS cove_festivals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,               -- 演出名，如：立冬夜 · 码头边的一场小型演出
  producer_id uuid NOT NULL REFERENCES users(id),   -- 发起的制作人
  venue text,                        -- 场地
  show_date date,                    -- 演出日期
  brief text,                        -- 邀请函正文：想做一场什么样的演出
  roles_needed jsonb,                -- 召集名录 [{"role":"吉他手","count":1},{"role":"词曲作者","count":2}]
  deadline timestamptz,              -- 报名截稿期
  status text DEFAULT 'draft'
    CHECK (status IN ('draft','open','locked','completed')),
  created_at timestamptz DEFAULT now()
);

-- 报名（≈ 摇篮 invitation submissions）
-- Rule B（摇篮已验证）：编辑权只看截稿期，截稿前可改，截稿后锁定；
-- 与审核状态无关，审核不锁编辑。应用层判断 now() < festivals.deadline。
CREATE TABLE IF NOT EXISTS cove_festival_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id uuid NOT NULL REFERENCES cove_festivals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,                -- 应征角色：乐手/歌手/词曲作者（细分自由填）
  message text,                      -- 自荐语
  demo_src jsonb,                    -- 小样 R2 双源（可选）
  review_status text DEFAULT 'pending'
    CHECK (review_status IN ('pending','accepted','declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (festival_id, user_id, role)
);

-- ---------- 8b. 灯塔（≈ 摇篮驻地：分层沉浸区） ----------
-- 摇篮驻地是七个 shader 区 + 等级门。海角的灯塔改为：
-- 随网站内容积累逐层点亮——unlock_after = 需要已发布的唱片行期数。
-- 网站每出一期，灯塔就亮一层。板块随内容生长，同摇篮的设计哲学。
CREATE TABLE IF NOT EXISTS cove_lighthouse_zones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  floor integer UNIQUE NOT NULL,     -- 第几层，1 在最下
  name text NOT NULL,                -- 层名，如：候潮室
  scene text,                        -- 场景渐变/shader 参数（前端渲染）
  ambience text,                     -- 该层的一句氛围文字
  unlock_after integer DEFAULT 0,    -- 点亮所需的已发布期数
  created_at timestamptz DEFAULT now()
);

-- ---------- 9. 邻港（≈ partners，status 'active'） ----------
-- 相邻的港口，各自有灯，互相照见：厂牌、唱片行、livehouse、媒体。
CREATE TABLE IF NOT EXISTS cove_partners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,                -- 厂牌/独立唱片行/livehouse
  kind text,                         -- label / record_shop / livehouse / media
  city text,
  intro text,
  logo_url text,
  link_url text,
  status text DEFAULT 'active' CHECK (status IN ('active','hidden')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS（沿用摇篮五批次的最终模式：匿名只读已发布，写走管理员）
-- ============================================================
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_musicians   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_beats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_curations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_works       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_interviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_echoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_festivals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_festival_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_lighthouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cove_partners    ENABLE ROW LEVEL SECURITY;

-- users：本人可读改自己，管理员全权
CREATE POLICY "users_self_read"  ON users FOR SELECT USING (auth_id = auth.uid() OR is_admin());
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "users_admin_all"  ON users FOR ALL USING (is_admin());

-- 公开内容：匿名读 published/active，管理员全权（防草稿泄漏，同摇篮 Batch 4）
CREATE POLICY "musicians_public_read" ON cove_musicians FOR SELECT
  USING (status = 'active' OR is_admin());
CREATE POLICY "musicians_admin_all" ON cove_musicians FOR ALL USING (is_admin());

CREATE POLICY "tracks_public_read" ON cove_tracks FOR SELECT
  USING (status = 'published' OR is_admin());
CREATE POLICY "tracks_admin_all" ON cove_tracks FOR ALL USING (is_admin());

-- beats 跟随所属 track 的可见性
CREATE POLICY "beats_public_read" ON cove_beats FOR SELECT
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM cove_tracks t
      WHERE t.id = cove_beats.track_id AND t.status = 'published'
    )
  );
CREATE POLICY "beats_admin_all" ON cove_beats FOR ALL USING (is_admin());

CREATE POLICY "curations_public_read" ON cove_curations FOR SELECT
  USING (status = 'published' OR is_admin());
CREATE POLICY "curations_admin_all" ON cove_curations FOR ALL USING (is_admin());

-- 船坞作品：公开读已发布；音乐人本人可管理自己的（own-or-admin，同摇篮 studio 模式）
CREATE POLICY "works_public_read" ON cove_works FOR SELECT
  USING (status = 'published' OR is_admin()
    OR EXISTS (SELECT 1 FROM cove_musicians m
               WHERE m.id = cove_works.musician_id AND m.user_id = current_user_id()));
CREATE POLICY "works_own_write" ON cove_works FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM cove_musicians m
              WHERE m.id = musician_id AND m.user_id = current_user_id()));
CREATE POLICY "works_own_update" ON cove_works FOR UPDATE
  USING (EXISTS (SELECT 1 FROM cove_musicians m
         WHERE m.id = cove_works.musician_id AND m.user_id = current_user_id()));
CREATE POLICY "works_admin_all" ON cove_works FOR ALL USING (is_admin());

CREATE POLICY "interviews_public_read" ON cove_interviews FOR SELECT
  USING (status = 'published' OR is_admin());
CREATE POLICY "interviews_admin_all" ON cove_interviews FOR ALL USING (is_admin());

-- 音乐节邀请函：公开读 open/locked/completed（草稿只有制作人和管理员可见）；
-- 制作人管理自己发起的场次（own-or-admin，同摇篮 studio 模式）
CREATE POLICY "festivals_public_read" ON cove_festivals FOR SELECT
  USING (status IN ('open','locked','completed')
    OR producer_id = current_user_id() OR is_admin());
CREATE POLICY "festivals_producer_insert" ON cove_festivals FOR INSERT
  WITH CHECK (producer_id = current_user_id());
CREATE POLICY "festivals_producer_update" ON cove_festivals FOR UPDATE
  USING (producer_id = current_user_id() OR is_admin());
CREATE POLICY "festivals_admin_all" ON cove_festivals FOR ALL USING (is_admin());

-- 报名：本人可见可管自己的；该场制作人可读全部报名；
-- ⚠ Rule B 的截稿锁在应用层判断（now() < deadline 才允许编辑），
--   RLS 只管归属，不管时间。
CREATE POLICY "subs_own_read" ON cove_festival_submissions FOR SELECT
  USING (user_id = current_user_id()
    OR is_admin()
    OR EXISTS (SELECT 1 FROM cove_festivals f
               WHERE f.id = cove_festival_submissions.festival_id
                 AND f.producer_id = current_user_id()));
CREATE POLICY "subs_own_insert" ON cove_festival_submissions FOR INSERT
  WITH CHECK (user_id = current_user_id());
CREATE POLICY "subs_own_update" ON cove_festival_submissions FOR UPDATE
  USING (user_id = current_user_id() OR is_admin());
CREATE POLICY "subs_own_delete" ON cove_festival_submissions FOR DELETE
  USING (user_id = current_user_id() OR is_admin());

-- 灯塔：人人可读，管理端维护
CREATE POLICY "lighthouse_public_read" ON cove_lighthouse_zones FOR SELECT USING (true);
CREATE POLICY "lighthouse_admin_all" ON cove_lighthouse_zones FOR ALL USING (is_admin());

-- 漂流瓶：所有人可读（锚定已发布歌曲），登录者可投，本人或管理员可删
CREATE POLICY "echoes_public_read" ON cove_echoes FOR SELECT
  USING (EXISTS (SELECT 1 FROM cove_tracks t
         WHERE t.id = cove_echoes.track_id AND t.status = 'published') OR is_admin());
CREATE POLICY "echoes_auth_insert" ON cove_echoes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "echoes_own_delete" ON cove_echoes FOR DELETE
  USING (user_id = current_user_id() OR is_admin());

CREATE POLICY "partners_public_read" ON cove_partners FOR SELECT
  USING (status = 'active' OR is_admin());
CREATE POLICY "partners_admin_all" ON cove_partners FOR ALL USING (is_admin());

-- ============================================================
-- 校验查询（插入数据前先跑，摇篮定下的规矩）
-- SELECT 'cove_musicians' t, status, count(*) FROM cove_musicians GROUP BY status
-- UNION ALL
-- SELECT 'cove_tracks', status, count(*) FROM cove_tracks GROUP BY status;
-- ============================================================
