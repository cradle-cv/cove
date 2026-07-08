# 海角 Cove

从海面下打捞每一首歌的故事。
域名：cove.ge（已注册于 Netim）。"Cove·歌" —— 海角，点歌。
字标「海角 COVE」，副题 COVE.GE。
同构 Cradle 摇篮的架构建立：Next.js 16 App Router（.js）+ Supabase + Cloudflare R2 + Vercel，GitHub 网页端提交部署。

---

## 一、命名映射（Cradle → Seacove）

### 板块

| Cradle 摇篮 | 海角 Seacove | 路由 |
|---|---|---|
| 每日一展/邀请函 | 每日音乐节（制作人邀请函，召集乐手/歌手/词曲作者） | `/festival` |
| 艺术阅览室 | 海角唱片行 | `/records` |
| 当代作品集 | 原创码头 | `/dock` |
| 艺术家 | 音乐人 | `/musicians` |
| 杂志社/专栏 | 海角电台（主持人专访） | `/radio` |
| 驻地 | 灯塔（随内容积累逐层点亮） | `/lighthouse` |
| 合作伙伴 | 邻港 | `/harbors` |
| （新增） | 漂流瓶（听众回声，嵌在歌曲页） | 无独立路由 |

### 数据表

| Cradle | Seacove | 状态值 |
|---|---|---|
| users | users | role: user / musician / admin / superadmin |
| gallery_artists | cove_musicians | **'active'** / hidden |
| gallery_works | cove_tracks | **'draft' / 'published'** |
| gallery_curations | cove_curations | **'draft' / 'published'** |
| （新增） | cove_beats | 无状态，跟随 track 可见性 |
| artworks / 作品集 | cove_works | **'draft' / 'published'** |
| articles / 杂志社 | cove_interviews | **'draft' / 'published'** |
| gallery_comments | cove_echoes | 无状态；无点赞无回复，只浮不互动 |
| 邀请函 | cove_festivals | **'draft' / 'open' / 'locked' / 'completed'** |
| 邀请函报名 | cove_festival_submissions | review_status: pending/accepted/declined；编辑锁走截稿期（Rule B） |
| 驻地 | cove_lighthouse_zones | 无状态；unlock_after = 点亮所需已发布期数 |
| partners | cove_partners | **'active'** / hidden |

⚠ **摇篮规矩，海角继承**：不同表状态值不同。插数据前先跑
`SELECT status, count(*) FROM 表名 GROUP BY status` 核对。

---

## 二、目录结构

```
seacove/
├── app/
│   ├── layout.js                    全站刊头带 + 导航
│   ├── globals.css                  设计 token（暖纸/深海蓝/海玻璃绿/赭石印章）
│   ├── page.js                      首页：最新一期 + 板块引路
│   ├── festival/
│   │   ├── page.js                  每日音乐节（邀请函列表）
│   │   └── [id]/page.js             邀请函详情（召集名录 + 截稿状态）
│   ├── records/
│   │   ├── page.js                  唱片行木架（期刊列表）
│   │   └── [id]/
│   │       ├── page.js              服务端取数（⚠ await params）
│   │       └── RecordShopClient.js  沉浸聆听 + 本期总览（客户端）
│   ├── dock/…                       原创码头（列表 + 作品详情）
│   ├── musicians/…                  音乐人（列表 + 详情）
│   ├── radio/…                      海角电台（专访列表 + 单期）
│   ├── lighthouse/page.js           灯塔（七层，随已发布期数逐层点亮）
│   ├── harbors/page.js              邻港
│   ├── login/page.js                登录/注册（邮箱密码；注册自动建 users 行）
│   └── admin/                       管理端（含守卫布局，仅 admin 可进）
│       ├── layout.js                身份守卫（同构摇篮 admin-only guard）
│       ├── curations/page.js        唱片行排期：建期、选曲排序、发布
│       ├── tracks/page.js           歌曲与字幕：【】标强调的行式字幕编辑器
│       ├── musicians/page.js        音乐人管理
│       ├── interviews/page.js       电台专访管理
│       ├── festivals/page.js        音乐节：发邀请函 + 审阅报名
│       └── partners/page.js         邻港管理
├── components/
│   ├── Narration.js                 涨潮字幕（结构化渲染，无 HTML 注入）
│   └── Echoes.js                    漂流瓶（读取/投放，登录后可投）
├── lib/
│   ├── supabase.js                  客户端 + fetchIssue 组装函数
│   ├── useSeacovePlayer.js          播放内核（Howler，含移动端解锁/淡入淡出）
│   ├── useUser.js                   会话 + 业务身份（RLS 认的 users 行）
│   └── beats.js                     字幕数据构造与选择逻辑
└── supabase/migrations/
    ├── 001_init.sql                 10 张表 + RLS（摇篮五批次最终模式）
    └── 002_seed.sql                 第七期《渡海的人》种子数据
```

---

## 三、项目代码规范（自摇篮继承）

1. **Next.js 16 + React 19**：服务端动态路由页的 `params` 是 Promise，
   必须 `const { id } = await params`。直接 `params.id` 会得到 undefined 导致 404。
   写新服务端页面前参考现有同类页面（如 `app/musicians/[id]/page.js`）。
2. 全部 `.js`，不用 TypeScript。
3. RLS 三原则：匿名只读 published/active；写操作走 `is_admin()`；
   音乐人自有内容走 `current_user_id()` own-or-admin（同摇篮 studio 模式）。
4. `users.id ≠ auth.uid()`：所有策略经 `current_user_id()` / `is_admin()`
   两个 SECURITY DEFINER 函数桥接，不在策略里直接比对 auth.uid()。
5. 管理端（/admin）与音乐人后台（未来 /studio）路由分离，各自守卫。
6. 文案规范：不用破折号；不用"不是…而是…"句式；长句托底，短句只在停顿处；
   结尾把问题留给读者。

---

## 四、内容与版权红线

- 站内播放器只播三类音源：站长本人的原创、入驻音乐人授权的原创、公版录音。
- 商业歌曲一律走 `cove_tracks.external_links` 外链跳转（网易云/QQ音乐），
  站内做品鉴，不做点播。
- `src` 为空时前端按 `duration` 计时模拟，视觉先行，音频后补。
- 音频存 R2 双源：`['x.webm','x.mp3']`，webm 在前。

---

## 五、部署步骤（无本地环境工作流）

1. **Supabase**：新建独立项目（不与摇篮共用）→ SQL Editor 依次执行
   `001_init.sql`、`002_seed.sql` → 复制 URL 和 anon key。
2. **GitHub**：新建仓库 `seacove`，网页端上传本目录全部文件。
3. **Vercel**：Import 仓库 → 环境变量填入
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Deploy。
4. **域名**：cove.ge（已注册于 Netim）→ Netim 后台把 DNS 解析指向 Vercel →
   Vercel 项目里绑定 cove.ge → R2 自定义域 cdn.cove.ge（音频与封面）。
   注意：.ge 的 DNS 在 Netim 后台的 Zone 管理里改，绑 Vercel 用 A 记录或 CNAME 按 Vercel 提示填。
5. 部署完成后访问 `/musicroom`，应看到第七期《渡海的人》，
   点进去即是沉浸聆听页（种子数据无音频，按时长模拟播放）。

---

## 六、已完成的功能面

- 登录体系：邮箱密码注册/登录，auth 触发器自动建 users 行
- 管理端全套：排期（建期/选曲/排序/发布）、歌曲与字幕编辑
  （行式录入，【】包强调段，保存时整表替换 cove_beats）、
  音乐人、专访、音乐节（发邀请函 + 报名审阅）、邻港
- 漂流瓶：唱片行沉浸页内，锚定当前曲，登录可投，60 字封顶
- 音乐节报名：Rule B 截稿锁（截稿前可报/可改/可撤，截稿即只读）
- 码头作品页：有音频源即可播放（复用播放内核）
- 灯塔：随已发布期数自动逐层点亮

## 七、部署后第一件事

注册一个账号，然后在 Supabase SQL Editor 把自己升为管理员：
```sql
UPDATE users SET role = 'admin' WHERE email = '你的邮箱';
```
之后访问 /admin 即可进入灯塔管理室。

## 八、v2 待办（不急）

1. 音乐人 /studio 路由（own-or-admin，作品与手记自管理）
2. 电台音频轨播放（cove_interviews.audio_src 字段已备）
3. 灯塔层内沉浸场景（每层一个 shader 场景，继承摇篮驻地的做法）
4. R2 直传（管理端音频/图片上传，presigned URL）
5. 海角通讯（每月一封，手动，保持人味）
