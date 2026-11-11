-- ============================================================
-- 海角 Cove · 打捞碎月 第 7 至 10 期（选曲编辑乙「屿」）
--   第 7 期《方言里的海》 第 8 期《灯下等人》
--   第 9 期《返乡》       第 10 期《靠岸》
-- 全部为草稿：cove_tracks / cove_curations = 'draft'，新建 cove_musicians = 'hidden'
-- 真实歌曲只做品鉴，src 留空，播放走 external_links 外链。
-- 涨潮字幕为原创小故事，不引用歌词，不写歌手本人的经历。
-- place 采用歌曲首次发行年份，查不实的留 null。
-- lead_instrument 一律 null。
-- 可重复执行：歌手按 name 去重，歌曲与期刊 on conflict (id) do nothing，字幕先删后插。
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. 音乐人（12 位，status='hidden'）
-- ------------------------------------------------------------

-- 来源：https://zh.wikipedia.org/wiki/江蕙
insert into cove_musicians (name,name_en,origin,bio,status)
select '江蕙','Jiang Hui','台湾嘉义',
  '江蕙生于嘉义县，1981年以本名江淑惠发行日语专辑出道，次年起发行台语专辑，1984年1月推出台语专辑《惜别的海岸》。',
  'hidden'
where not exists (select 1 from cove_musicians where name='江蕙');

-- 来源：https://zh.wikipedia.org/wiki/海闊天空_(Beyond歌曲)
insert into cove_musicians (name,name_en,origin,bio,status)
select 'Beyond','Beyond','香港',
  'Beyond是来自香港的摇滚乐队，1993年5月发行粤语专辑《乐与怒》，其中的《海阔天空》由黄家驹作词作曲并担任主唱。',
  'hidden'
where not exists (select 1 from cove_musicians where name='Beyond');

-- 来源：https://zh.wikipedia.org/wiki/生祥樂隊 ；https://beehy.pe/sheng-xiang-band-village-besieged-taiwan/
insert into cove_musicians (name,name_en,origin,bio,status)
select '生祥乐队','Sheng Xiang & Band','台湾',
  '生祥乐队由林生祥领衔，2012年7月起以生祥乐队为名演出，2016年发行以客家话演唱、关注石化工业污染的双专辑《围庄》。',
  'hidden'
where not exists (select 1 from cove_musicians where name='生祥乐队');

-- 来源：https://music.163.com/artist/desc?id=4721 ；https://music.163.com/song?id=139385
insert into cove_musicians (name,name_en,origin,bio,status)
select '朴树','Pu Shu','江苏南京',
  '朴树1973年生于江苏南京，1999年1月发行首张专辑《我去2000年》，《白桦林》收录其中。',
  'hidden'
where not exists (select 1 from cove_musicians where name='朴树');

-- 来源：https://zh.wikipedia.org/zh-tw/齊秦
insert into cove_musicians (name,name_en,origin,bio,status)
select '齐秦','Chyi Chin','台湾台中',
  '齐秦1960年生于台中，是家中最小的孩子，姐姐齐豫也是歌手，《外面的世界》收在他1987年发行的专辑《冬雨》中。',
  'hidden'
where not exists (select 1 from cove_musicians where name='齐秦');

-- 来源：https://music.163.com/song?id=26494698
insert into cove_musicians (name,name_en,origin,bio,status)
select '张玮玮','Zhang Weiwei',null,
  '张玮玮2012年发行专辑《白银饭店》，其中的《米店》由他与郭龙共同演唱。',
  'hidden'
where not exists (select 1 from cove_musicians where name='张玮玮');

-- 来源：https://music.163.com/artist/desc?id=3686 ；https://music.163.com/song?id=109525
insert into cove_musicians (name,name_en,origin,bio,status)
select '罗大佑','Lo Ta-yu','台湾',
  '罗大佑1954年出生，1982年4月21日在台湾发行首张个人专辑《之乎者也》，《鹿港小镇》收录其中。',
  'hidden'
where not exists (select 1 from cove_musicians where name='罗大佑');

-- 来源：https://en.wikipedia.org/wiki/Fei_Xiang ；https://music.163.com/song?id=83207
insert into cove_musicians (name,name_en,origin,bio,status)
select '费翔','Kris Phillips','台湾台北',
  '费翔1960年生于台北，1987年在中央电视台春节联欢晚会上演唱《故乡的云》和《冬天里的一把火》，1991年以 Kris Phillips 之名参加百老汇音乐剧《西贡小姐》的首演阵容。',
  'hidden'
where not exists (select 1 from cove_musicians where name='费翔');

-- 来源：https://music.163.com/song?id=122021
insert into cove_musicians (name,name_en,origin,bio,status)
select '李春波','Li Chunbo',null,
  '李春波的《一封家书》收在他的同名专辑《一封家书》中。',
  'hidden'
where not exists (select 1 from cove_musicians where name='李春波');

-- 来源：https://en.wikipedia.org/wiki/Su_Rui ；https://music.163.com/song?id=287752
insert into cove_musicians (name,name_en,origin,bio,status)
select '苏芮','Julie Su','台湾台北',
  '苏芮1952年生于台北，1983年因电影《搭错车》的原声带在台湾走红，1993年发行专辑《牵手》。',
  'hidden'
where not exists (select 1 from cove_musicians where name='苏芮');

-- 来源：https://zh.wikipedia.org/wiki/張懸 ；https://music.163.com/artist/desc?id=10557
insert into cove_musicians (name,name_en,origin,bio,status)
select '张悬','Anpu','台湾台北',
  '张悬本名焦安溥，1981年生于台北，2006年发行首张正式专辑《My Life Will…》，《宝贝》收录其中。',
  'hidden'
where not exists (select 1 from cove_musicians where name='张悬');

-- 来源：https://en.wikipedia.org/wiki/Wan_Xiaoli
insert into cove_musicians (name,name_en,origin,bio,status)
select '万晓利','Wan Xiaoli','河北邯郸',
  '万晓利1971年生于河北邯郸，2002年发行专辑《走过来走过去》，2006年发行专辑《这一切没有想象的那么糟》。',
  'hidden'
where not exists (select 1 from cove_musicians where name='万晓利');


-- ------------------------------------------------------------
-- 2. 歌曲（12 首，status='draft'）
-- ------------------------------------------------------------

-- 第 7 期 · 1《惜别的海岸》江蕙（闽南语）
-- 来源：https://music.163.com/song?id=1321312362 （收录于 2012 年《乡城台语精选, Vol. 1》，222 秒）；年份：https://zh.wikipedia.org/wiki/江蕙 （1984 年 1 月台语专辑《惜别的海岸》）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0070000-0000-4000-8000-000000000001',
 (select id from cove_musicians where name='江蕙' limit 1),
 '惜别的海岸','Farewell Coast','1984','别',222,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=1321312362"}]',
 'linear-gradient(170deg,#E3C9A2,#B98E6A 48%,#5E5A5E)',
 'linear-gradient(180deg,rgba(196,170,140,.62),rgba(120,128,130,.86) 50%,#3C4248)',
 null,'draft')
on conflict (id) do nothing;

-- 第 7 期 · 2《海阔天空》Beyond（粤语）
-- 来源：https://music.163.com/song?id=347230 （326 秒）；专辑与年份：https://zh.wikipedia.org/wiki/海闊天空_(Beyond歌曲)
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0070000-0000-4000-8000-000000000002',
 (select id from cove_musicians where name='Beyond' limit 1),
 '海阔天空','Boundless Oceans, Vast Skies','1993','阔',326,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=347230"}]',
 'linear-gradient(160deg,#9FB8C4,#5C7C8E 46%,#22323F)',
 'linear-gradient(180deg,rgba(120,156,170,.6),rgba(52,86,104,.9) 52%,#14232E)',
 null,'draft')
on conflict (id) do nothing;

-- 第 7 期 · 3《围庄》生祥乐队（客家话）
-- 来源：https://music.apple.com/gb/song/village-besieged/1590089962 （碟一第 3 首，4:24）；专辑：https://music.apple.com/tw/album/%E5%9C%8D%E5%BA%84/1590089959 （2016）；网易云专辑 https://music.163.com/album/34726954 （未查到该曲单曲页）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0070000-0000-4000-8000-000000000003',
 (select id from cove_musicians where name='生祥乐队' limit 1),
 '围庄','Village Besieged','2016','庄',264,null,
 '[{"platform":"Apple Music","url":"https://music.apple.com/gb/song/village-besieged/1590089962"}]',
 'linear-gradient(175deg,#B7B2A0,#7D7A6C 44%,#3A3B36)',
 'linear-gradient(180deg,rgba(150,148,128,.66),rgba(96,98,88,.88) 48%,#2E302C)',
 null,'draft')
on conflict (id) do nothing;

-- 第 8 期 · 1《白桦林》朴树
-- 来源：https://music.163.com/song?id=139385 （专辑《我去2000年》，1999，227 秒）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0080000-0000-4000-8000-000000000001',
 (select id from cove_musicians where name='朴树' limit 1),
 '白桦林','Birch Forest','1999','橘',227,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=139385"}]',
 'linear-gradient(180deg,#E8E6DE,#B9BCBA 40%,#6E7A82 78%,#3B4650)',
 'linear-gradient(180deg,rgba(214,218,216,.55),rgba(126,140,150,.85) 50%,#2C3640)',
 null,'draft')
on conflict (id) do nothing;

-- 第 8 期 · 2《外面的世界》齐秦
-- 来源：https://open.spotify.com/track/17YtcMmGKjAOhfrJEVZoLL （专辑《冬雨》，1987，319 秒）；年份与专辑：https://zh.wikipedia.org/zh-tw/齊秦 ；网易云 https://music.163.com/song?id=26524428 为 2013 年节目录音，未采用
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0080000-0000-4000-8000-000000000002',
 (select id from cove_musicians where name='齐秦' limit 1),
 '外面的世界','The World Outside','1987','杏',319,null,
 '[{"platform":"Spotify","url":"https://open.spotify.com/track/17YtcMmGKjAOhfrJEVZoLL"}]',
 'linear-gradient(165deg,#D8B57C,#9A7448 50%,#3F3226)',
 'linear-gradient(180deg,rgba(206,170,112,.58),rgba(118,92,64,.88) 50%,#2A221C)',
 null,'draft')
on conflict (id) do nothing;

-- 第 8 期 · 3《米店》张玮玮、郭龙
-- 来源：https://music.163.com/song?id=26494698 （专辑《白银饭店》，2012-05-26，336 秒）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0080000-0000-4000-8000-000000000003',
 (select id from cove_musicians where name='张玮玮' limit 1),
 '米店','Rice Shop','2012','窑',336,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=26494698"}]',
 'linear-gradient(170deg,#E6C98E,#B4864E 42%,#5A3E2C 80%,#2E241E)',
 'linear-gradient(180deg,rgba(220,186,128,.5),rgba(140,104,70,.86) 46%,#33261E)',
 null,'draft')
on conflict (id) do nothing;

-- 第 9 期 · 1《鹿港小镇》罗大佑
-- 来源：https://music.163.com/song?id=109525 （专辑《之乎者也》，1982-04-21，283 秒）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0090000-0000-4000-8000-000000000001',
 (select id from cove_musicians where name='罗大佑' limit 1),
 '鹿港小镇','Lukang Town','1982','姊',283,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=109525"}]',
 'linear-gradient(160deg,#C98F6A,#8E5E4A 46%,#3E2E2C)',
 'linear-gradient(180deg,rgba(190,140,110,.55),rgba(116,84,74,.86) 50%,#2C2224)',
 null,'draft')
on conflict (id) do nothing;

-- 第 9 期 · 2《故乡的云》费翔
-- 来源：https://music.163.com/song?id=83207 （专辑《跨越四海的歌声》，1987-07-01，270 秒）；春晚演唱：https://en.wikipedia.org/wiki/Fei_Xiang
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0090000-0000-4000-8000-000000000002',
 (select id from cove_musicians where name='费翔' limit 1),
 '故乡的云','Clouds of My Homeland','1987','乡',270,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=83207"}]',
 'linear-gradient(180deg,#B8C6D2,#D9C7A4 46%,#9C8460 78%,#4A3F34)',
 'linear-gradient(180deg,rgba(200,200,186,.5),rgba(150,134,104,.84) 52%,#3A322A)',
 null,'draft')
on conflict (id) do nothing;

-- 第 9 期 · 3《一封家书》李春波
-- 来源：https://music.163.com/song?id=122021 （专辑《一封家书》，网易云标注 1994-01-01，与常见说法不一致，place 留空；214 秒）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0090000-0000-4000-8000-000000000003',
 (select id from cove_musicians where name='李春波' limit 1),
 '一封家书','A Letter Home',null,'河',214,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=122021"}]',
 'linear-gradient(165deg,#C4524A,#8C3A36 44%,#3A2626)',
 'linear-gradient(180deg,rgba(180,96,86,.5),rgba(110,62,58,.86) 50%,#2A1C1C)',
 null,'draft')
on conflict (id) do nothing;

-- 第 10 期 · 1《牵手》苏芮
-- 来源：https://music.163.com/song?id=287752 （专辑《牵手》，1993-03-18，345 秒）；https://en.wikipedia.org/wiki/Su_Rui
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0100000-0000-4000-8000-000000000001',
 (select id from cove_musicians where name='苏芮' limit 1),
 '牵手','Holding Hands','1993','牵',345,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=287752"}]',
 'linear-gradient(170deg,#C9D3A8,#8FA07A 46%,#46523E)',
 'linear-gradient(180deg,rgba(170,186,150,.55),rgba(104,124,100,.86) 50%,#2E3A30)',
 null,'draft')
on conflict (id) do nothing;

-- 第 10 期 · 2《宝贝》张悬
-- 来源：https://music.163.com/song?id=326738 （《宝贝 (In a Day)》，专辑《my life will…》，网易云标注 2007-09-14，147 秒）；维基记首张正式专辑为 2006 年：https://zh.wikipedia.org/wiki/張懸 ；两处年份不一致，place 留空
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0100000-0000-4000-8000-000000000002',
 (select id from cove_musicians where name='张悬' limit 1),
 '宝贝','Baby',null,'窝',147,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=326738"}]',
 'linear-gradient(175deg,#F0D9C8,#D8A898 44%,#8C6C6E 80%,#4A3E46)',
 'linear-gradient(180deg,rgba(232,200,186,.5),rgba(170,130,128,.84) 50%,#3A3038)',
 null,'draft')
on conflict (id) do nothing;

-- 第 10 期 · 3《这一切没有想象的那么糟》万晓利
-- 来源：https://music.163.com/song?id=5240791 （收录于 2010 年合辑《榕树下 民谣在路上》，213 秒）；同名专辑 2006 年：https://en.wikipedia.org/wiki/Wan_Xiaoli （未能确认这首歌的首发年份，place 留空）
insert into cove_tracks (id,musician_id,title,title_en,place,seal,duration,src,external_links,art,sea,lead_instrument,status) values
('c0100000-0000-4000-8000-000000000003',
 (select id from cove_musicians where name='万晓利' limit 1),
 '这一切没有想象的那么糟','It''s Not As Bad As Imagined',null,'安',213,null,
 '[{"platform":"网易云音乐","url":"https://music.163.com/song?id=5240791"}]',
 'linear-gradient(160deg,#D6B96A,#A3884A 40%,#5C5A44 76%,#2E3230)',
 'linear-gradient(180deg,rgba(200,180,110,.5),rgba(120,118,88,.86) 50%,#262A28)',
 null,'draft')
on conflict (id) do nothing;


-- ------------------------------------------------------------
-- 3. 涨潮字幕（cove_beats，先删后插）
-- ------------------------------------------------------------

-- 惜别的海岸
delete from cove_beats where track_id='c0070000-0000-4000-8000-000000000001';
insert into cove_beats (track_id,ord,at,segments) values
('c0070000-0000-4000-8000-000000000001',1,0.03,'[{"t":"七股的海堤上每到傍晚就摆出一排小摊，阿月的烤小卷摊在最靠南的那一头，她每天下午三点去附近的鱼市等货，挑当天最新鲜的小卷，挑得又慢又细，常被卖鱼的阿伯笑：「挑这么细，是在挑女婿喔？」"}]'),
('c0070000-0000-4000-8000-000000000001',2,0.17,'[{"t":"隔壁卖椰子水的是从越南嫁过来的阿兰，两个人起初几乎不说话，阿兰的国语只会几句，阿月的越南话一句也不会，只有收摊的时候，会互相帮着把遮阳棚的绳子解下来。"}]'),
('c0070000-0000-4000-8000-000000000001',3,0.31,'[{"t":"有一天阿兰端来一小碗自己调的酱，鱼露、青柠和辣椒捣在一起，说：「你试试，烤好的蘸这个，"},{"t":"我们那边海边都这样吃","em":true},{"t":"。」阿月尝了一口，皱着眉没吭声，第二天一早多进了一斤小卷。"}]'),
('c0070000-0000-4000-8000-000000000001',4,0.46,'[{"t":"她们把两样东西凑在一起卖，一串烤小卷配一小杯阿兰的酱，再加一杯椰子水，价钱比原来各卖各的贵了十块，海堤上的学生和骑车来看夕阳的人，倒是渐渐排起了队。"}]'),
('c0070000-0000-4000-8000-000000000001',5,0.61,'[{"t":"生意好起来以后，两个人的分账总算不清楚，阿兰掰着手指头算，阿月拿计算机按，按到最后差个二三十块，谁也不肯多拿，就把零头投进摊子边那个装零钱的奶粉罐里。"}]'),
('c0070000-0000-4000-8000-000000000001',6,0.77,'[{"t":"那个奶粉罐到了年底拿去银行换成了一张存单，两个人站在柜台前，柜员问户头写谁的名字，阿兰看阿月，阿月看阿兰，最后阿月开口说：「写她的，她孩子明年要读小学了。」"}]'),
('c0070000-0000-4000-8000-000000000001',7,0.92,'[{"t":"后来海堤上又多了几个摊子，有人学着卖鱼露酱，阿兰有点不高兴，阿月倒不太在意，照样每天三点去鱼市，只是现在骑车出门的时候，后座会多绑一个空篮子，替阿兰捎一袋青柠回来。"}]');

-- 海阔天空
delete from cove_beats where track_id='c0070000-0000-4000-8000-000000000002';
insert into cove_beats (track_id,ord,at,segments) values
('c0070000-0000-4000-8000-000000000002',1,0.03,'[{"t":"《海阔天空》收在Beyond于1993年5月发行的粤语专辑《乐与怒》里，由黄家驹作词、作曲并担任主唱，这里链接的录音在网易云音乐上归在同年九月发行的《海阔天空》名下。"}]'),
('c0070000-0000-4000-8000-000000000002',2,0.18,'[{"t":"阿康到西贡海边的海鲜档当学徒时还没满十八岁，每天清早四点去接渔排送来的货，冬天把手伸进养石斑的水箱里，冷得整条胳膊发麻，老板说：「熬过三个冬天，手就不抖了。」"}]'),
('c0070000-0000-4000-8000-000000000002',3,0.35,'[{"t":"他把工钱分成三份，一份寄回家里，一份交房租，剩下的一小份塞进床底的一个饼干罐，罐盖上用胶布贴着一张纸条，写着开档用，谁也不许碰，连他自己缺钱吃饭的时候也没碰过。"}]'),
('c0070000-0000-4000-8000-000000000002',4,0.52,'[{"t":"第三年老板的档口被收回去改建，他抱着饼干罐在海堤上坐了一整晚，第二天还是四点起床，走到对面另一家档口，问人家缺不缺一个会挑鱼、手不怕冷的伙计。"}]'),
('c0070000-0000-4000-8000-000000000002',5,0.70,'[{"t":"新档口的老板娘在旁边看他挑了一筐花蟹，忍不住问他：「你挑蟹怎么先看肚子？」他说：「肚子硬的才有肉，这是我师傅教的，他的档口没了，"},{"t":"手艺总不能也跟着没了","em":true},{"t":"。」"}]'),
('c0070000-0000-4000-8000-000000000002',6,0.88,'[{"t":"过了好些年他终于在海边开了自己的小档，门口的招牌是旧档口拆下来的木板改的，有熟客问他怎么不换块新的，他抬头看了一眼，说：「泡过海水的木头不容易变形，再挂十几年都没问题。」"}]');

-- 围庄
delete from cove_beats where track_id='c0070000-0000-4000-8000-000000000003';
insert into cove_beats (track_id,ord,at,segments) values
('c0070000-0000-4000-8000-000000000003',1,0.03,'[{"t":"生祥乐队在2016年发行了用客家话演唱的双专辑《围庄》，整张专辑关注石化工业给乡村带来的污染，这首同名曲排在第一张碟的第三首，长四分二十四秒。"}]'),
('c0070000-0000-4000-8000-000000000003',2,0.16,'[{"t":"秀英在台西的蚵田里做了四十年，每天推着竹筏走进泥滩，把蚵架上的蚵仔一串串剥下来，手背上全是细小的白疤，有人问起，她把手往围裙上一擦，说：「剥蚵的人手都这样，不稀奇。」"}]'),
('c0070000-0000-4000-8000-000000000003',3,0.30,'[{"t":"她年轻时站在蚵田里往北看，只看得见一片灰蓝的海，后来海那边陆续立起了高高的烟囱，夜里亮着灯，像一座不睡觉的城，她的儿子长大以后就在那座城里上夜班。"}]'),
('c0070000-0000-4000-8000-000000000003',4,0.45,'[{"t":"儿子每次回家都劝她：「别下田了，蚵仔现在不值钱。」她不吭声，第二天照样天不亮就出门，回来把剥好的蚵仔装进保鲜盒，塞进儿子机车后面的置物箱里。"}]'),
('c0070000-0000-4000-8000-000000000003',5,0.60,'[{"t":"有一年蚵仔死了一大片，翻过来全是空壳，她蹲在泥滩上一个个捡起来看，跟赶来的儿子说：「你帮我记一下，今年死的比去年多，明年要是还这样，我就去问问是怎么回事。」"}]'),
('c0070000-0000-4000-8000-000000000003',6,0.76,'[{"t":"第二年她真的去问了，带着一本记满日期和数目的小簿子，坐了两个钟头的车去乡公所，排队的时候她把簿子翻来翻去，"},{"t":"生怕哪一页的字写得太丑","em":true},{"t":"，办事的人看不懂。"}]'),
('c0070000-0000-4000-8000-000000000003',7,0.91,'[{"t":"儿子后来把那本簿子要了过去，一页页拍成照片存进手机，原本那本用塑料袋包好，放回秀英床头的抽屉里，第二年开春，她又把它拿出来，翻到最后写过的那一页，接着往下记。"}]');

-- 白桦林
delete from cove_beats where track_id='c0080000-0000-4000-8000-000000000001';
insert into cove_beats (track_id,ord,at,segments) values
('c0080000-0000-4000-8000-000000000001',1,0.03,'[{"t":"母亲的手术从晚上九点开始，护士说顺利的话要五个钟头，小禾在手术室外的走廊上找了一把靠墙的椅子坐下，把手机调成静音又调回来，生怕漏掉里面打出来的电话。"}]'),
('c0080000-0000-4000-8000-000000000001',2,0.17,'[{"t":"走廊尽头有个拖地的阿姨，拖到她脚边停下来，看了看她手里捏得发软的缴费单，说：「"},{"t":"剥个橘子吃吧","em":true},{"t":"，干坐着等，时间过得最慢。」说着从推车上拿了一个橘子塞给她。"}]'),
('c0080000-0000-4000-8000-000000000001',3,0.32,'[{"t":"她剥橘子剥得很仔细，把白色的筋一根根撕干净，撕完了也不吃，摆在膝盖上的纸巾里，又去剥第二个，阿姨拖完一圈回来，看见她膝盖上摆着三个光溜溜的橘子，忍不住笑出了声。"}]'),
('c0080000-0000-4000-8000-000000000001',4,0.47,'[{"t":"半夜两点手术室的门开过一次，出来的医生喊的是另一位病人的家属，一对老夫妻慌慌张张地站起来跟了进去，她也跟着站了一下，又慢慢坐回去，把膝盖上的橘子往里挪了挪。"}]'),
('c0080000-0000-4000-8000-000000000001',5,0.62,'[{"t":"她给在外地的弟弟发消息，打了好几行字又删掉，最后只发出去「还在做」三个字，弟弟马上回过来：「我也没睡，要不要打个电话？」她低头打字回他：「不用，这里太安静了，说话有回声。」"}]'),
('c0080000-0000-4000-8000-000000000001',6,0.78,'[{"t":"天快亮的时候走廊的窗户先白起来，楼下的早点铺开始卸门板，阿姨换班前又绕过来一趟，把她膝盖上那几个橘子装进一个塑料袋，说：「留着给你妈醒了吃，凉的解渴。」"}]'),
('c0080000-0000-4000-8000-000000000001',7,0.93,'[{"t":"六点二十门开了，医生摘下口罩喊她母亲的名字，她站起来时忘了腿上的塑料袋，橘子滚了一地，她顾不上去捡，先应了一声「在这儿」，那一声大得把走廊里打盹的人都惊醒了。"}]');

-- 外面的世界
delete from cove_beats where track_id='c0080000-0000-4000-8000-000000000002';
insert into cove_beats (track_id,ord,at,segments) values
('c0080000-0000-4000-8000-000000000002',1,0.03,'[{"t":"敦煌城外的杏园在四月初开满了花，天气预报说夜里要降到零下三度，老马吃过晚饭就扛着两捆麦草和一桶废机油进了园子，老伴在后面拎着一只暖水瓶和两个馒头跟着。"}]'),
('c0080000-0000-4000-8000-000000000002',2,0.17,'[{"t":"防霜的法子是老辈人传下来的，在园子的上风口隔一段堆一堆麦草，浇上机油点着，不让它起明火，只让它冒浓烟，烟压在树梢上，像给满园的花盖了一床薄被子。"}]'),
('c0080000-0000-4000-8000-000000000002',3,0.31,'[{"t":"十一点以后气温开始往下掉，老马隔半个钟头就去看一次挂在树杈上的温度计，打着手电凑近了看，看完回来也不说几度，老伴问他，他只说：「还行，你先把馒头吃了。」"}]'),
('c0080000-0000-4000-8000-000000000002',4,0.46,'[{"t":"两点多风向转了，烟都往园子外头飘，老马拖着铁锨把草堆挨个往西挪，挪到最后一堆的时候，"},{"t":"脚下一滑坐进了水渠","em":true},{"t":"，棉裤湿到膝盖，他坐在渠沿上拧了两把，又爬起来接着挪。"}]'),
('c0080000-0000-4000-8000-000000000002',5,0.61,'[{"t":"老伴把暖水瓶里的热水倒进瓶盖递给他，他喝了两口，两个人背靠着园子里最老的那棵杏树坐下来，那棵树是他爹当年亲手栽的，比他们结婚的年头还长，每年开花都开得最早。"}]'),
('c0080000-0000-4000-8000-000000000002',6,0.77,'[{"t":"天亮前那一阵最冷，温度计停在零下两度一直不动，老马盯着东边的山头，嘴里念叨太阳怎么还不出来，老伴把一捆麦草推到他脚边，说：「你念叨它也不会快，起来添把草去。」"}]'),
('c0080000-0000-4000-8000-000000000002',7,0.92,'[{"t":"太阳翻过山头的时候，他钻到树底下掰下一朵花，用指甲把花瓣拨开，看见花心还是青的，就把那朵花举起来，冲着园子另一头正在收暖水瓶的老伴喊：「花心是青的，今年的杏有指望了。」"}]');

-- 米店
delete from cove_beats where track_id='c0080000-0000-4000-8000-000000000003';
insert into cove_beats (track_id,ord,at,segments) values
('c0080000-0000-4000-8000-000000000003',1,0.03,'[{"t":"景德镇的老周烧了三十年柴窑，每次满窑都要烧上三十多个钟头，最后那一夜他从来不睡，搬一把竹椅坐在窑口边上，隔一会儿就凑到观火孔前，眯着眼看一眼里头的火色。"}]'),
('c0080000-0000-4000-8000-000000000003',2,0.17,'[{"t":"这一窑里有一半是给一家茶馆订的盖碗，茶馆老板付了定金，说春节前要摆上桌，老周嘴上答应着，心里清楚柴窑这东西要看天吃饭，开窑之前，谁也说不准能出几只好的。"}]'),
('c0080000-0000-4000-8000-000000000003',3,0.32,'[{"t":"徒弟小葛守前半夜，往火膛里添松柴添得太急，火苗一下子蹿上来，老周在后面喊他：「慢点添，火一猛，釉面要起泡的。」小葛吓得缩回手，后半夜添柴都是一根根数着来的。"}]'),
('c0080000-0000-4000-8000-000000000003',4,0.47,'[{"t":"熄火以后还要再闷两天，窑温一点点降下来，那两天老周反倒睡得最多，吃完饭就躺在窑边的小屋里，小葛问他：「师傅，你不急啊？」他翻了个身说：「急什么，开了窑就知道了。」"}]'),
('c0080000-0000-4000-8000-000000000003',5,0.62,'[{"t":"开窑那天一早来了好几个人，茶馆老板也来了，站得远远的不敢靠近，老周戴上手套，先把封窑门的砖一块块拆下来，一股热气扑出来，带着松烟的味道，熏得人直眯眼睛。"}]'),
('c0080000-0000-4000-8000-000000000003',6,0.77,'[{"t":"头几个匣钵里出来的盖碗有两只粘了窑渣，一只釉色发闷，茶馆老板脸上的笑一点点收了回去，老周接着往里掏，掏到第五个匣钵，拿出来的一只青白釉在太阳底下透着光。"}]'),
('c0080000-0000-4000-8000-000000000003',7,0.92,'[{"t":"那一窑最后出了十一只好的，比订下的少一只，老周把最透的那只放进茶馆老板手里，又从小屋的柜子里翻出一只自己用了好几年的盖碗，"},{"t":"拿袖子擦了擦","em":true},{"t":"，凑成了一整套。"}]');

-- 鹿港小镇
delete from cove_beats where track_id='c0090000-0000-4000-8000-000000000001';
insert into cove_beats (track_id,ord,at,segments) values
('c0090000-0000-4000-8000-000000000001',1,0.03,'[{"t":"屏东乡下的大姑要过九十岁生日，生日前一个礼拜父亲打电话来，说什么也要回去一趟，阿杰请了三天假，把后座放平铺上毯子让父亲半躺着，自己开车从台中一路往南走。"}]'),
('c0090000-0000-4000-8000-000000000001',2,0.17,'[{"t":"父亲不肯用导航，坐起来扒着前座的椅背给他指路，过了高屏溪就开始数路边的东西，第几座土地公庙右转，第几棵槟榔树后面有条小路，阿杰半信半疑地照着拐，居然一次也没走错。"}]'),
('c0090000-0000-4000-8000-000000000001',3,0.32,'[{"t":"路上父亲讲了很多大姑的事，从她出嫁那天偷偷塞给他两个红蛋讲起，一直讲到他去当兵，大姑骑了一个钟头的脚踏车，"},{"t":"给他送去一罐炒好的花生","em":true},{"t":"，这些阿杰从来没听过，听得好几次忘了看后视镜。"}]'),
('c0090000-0000-4000-8000-000000000001',4,0.47,'[{"t":"到了大姑家门口，一群阿杰不认得的表亲涌出来，七手八脚把父亲扶下车，大姑坐在藤椅上，眼睛已经不太看得清了，父亲走过去蹲在她跟前，叫了一声：「阿姊，是我，阿忠。」"}]'),
('c0090000-0000-4000-8000-000000000001',5,0.62,'[{"t":"大姑伸手摸他的脸，摸到下巴上的胡茬，皱起眉头说：「这么大年纪了，还不刮胡子。」一屋子人都笑了，父亲也跟着笑，笑完转过身去，低着头在口袋里找了半天老花眼镜。"}]'),
('c0090000-0000-4000-8000-000000000001',6,0.77,'[{"t":"寿宴摆在院子里，十几桌，父亲坐在大姑旁边一直替她剥虾，剥好了就放进她碗里，自己一口没顾上吃，阿杰坐在隔壁桌，听几个表亲用他听不太懂的话聊天，聊的好像都是父亲小时候的糗事。"}]'),
('c0090000-0000-4000-8000-000000000001',7,0.92,'[{"t":"回台中的路上父亲睡得很沉，阿杰这回开了导航，开到高屏溪桥上的时候，父亲忽然醒过来，翻了个身又睡过去，手里一直攥着大姑硬塞给他的一包红龟粿，攥得包装纸都起了皱。"}]');

-- 故乡的云
delete from cove_beats where track_id='c0090000-0000-4000-8000-000000000002';
insert into cove_beats (track_id,ord,at,segments) values
('c0090000-0000-4000-8000-000000000002',1,0.03,'[{"t":"老包开了十九年长途货车，常跑天津到乌鲁木齐那条线，驾驶室的遮阳板上夹着一张全家福，照片里的院子在赤峰乡下，离他平常走的路线总差着三百多公里。"}]'),
('c0090000-0000-4000-8000-000000000002',2,0.17,'[{"t":"他算过很多回，绕一趟要"},{"t":"多烧两箱油","em":true},{"t":"，还要耽误一天半的工期，扣掉的钱够家里买一冬天的煤，所以十几年里他一回也没绕过去，每次路过那个岔口，只是按两声喇叭。"}]'),
('c0090000-0000-4000-8000-000000000002',3,0.32,'[{"t":"母亲每年打电话都只说家里都好，叫他别惦记，有一年电话里多说了一句，说院子里那棵沙果树今年结得特别多，吃不完，晒成了干，给他留了满满一口袋。"}]'),
('c0090000-0000-4000-8000-000000000002',4,0.47,'[{"t":"那年秋天他在张家口卸完货，看了看表，给调度打电话说车有点毛病要修，挂了电话就掉转车头往东北开，一路上把收音机开得很大，跟着里头的二人转哼了几百公里。"}]'),
('c0090000-0000-4000-8000-000000000002',5,0.62,'[{"t":"进村的土路窄，大车开不进去，他把车停在村口的打谷场上，走了二里地到家门口，母亲正蹲在院子里择菜，抬头看见他，愣了一下，头一句话是：「车停哪儿了，别挡了人家拉玉米的道。」"}]'),
('c0090000-0000-4000-8000-000000000002',6,0.77,'[{"t":"他在家只住了一晚，第二天天没亮就走，母亲把那口袋沙果干塞进驾驶室，又塞了一罐腌好的咸菜，叮嘱他少抽烟，他嘴上答应着，那罐咸菜一直吃到过了嘉峪关才见底。"}]'),
('c0090000-0000-4000-8000-000000000002',7,0.92,'[{"t":"第二年开春他又跑上了天津到乌鲁木齐那条线，路过那个岔口时照旧按了两声喇叭，驾驶座底下塞着那只洗干净的咸菜罐，罐里装着他路上嗑的瓜子，嗑完一罐，再去服务区续上。"}]');

-- 一封家书
delete from cove_beats where track_id='c0090000-0000-4000-8000-000000000003';
insert into cove_beats (track_id,ord,at,segments) values
('c0090000-0000-4000-8000-000000000003',1,0.03,'[{"t":"乡里的中学离阿木家有十二里山路，他从初一开始住校，每个星期五下午放了学，就和小他一岁的表弟一起走回去，两个人的书包里塞着一个星期没洗的衣服，走起来鼓鼓囊囊的。"}]'),
('c0090000-0000-4000-8000-000000000003',2,0.18,'[{"t":"路上要翻一道梁，再蹚过一条河，河里的石墩子是村里人一块块搬来垫上的，水大的时候会淹掉两块，阿木就先跳过去，站在没淹的石墩上，伸手把表弟拽过来。"}]'),
('c0090000-0000-4000-8000-000000000003',3,0.34,'[{"t":"夏天他们会在河边停一会儿，卷起裤腿摸虾，摸到的装进矿泉水瓶，表弟总是摸得比他多，阿木不服气，把瓶子往岸上一插，说：「你那是碰上的，下礼拜我换个地方摸。」"}]'),
('c0090000-0000-4000-8000-000000000003',4,0.50,'[{"t":"冬天天黑得早，翻过梁的时候天已经擦黑，表弟有点怕，走着走着就要拉阿木的衣角，阿木嘴上嫌他烦，还是把步子放慢了，两个人数着路边的电线杆走，数到第四十七根，就能看见村口的灯。"}]'),
('c0090000-0000-4000-8000-000000000003',5,0.66,'[{"t":"有一回河水涨得厉害，石墩子全淹了，两个人站在岸边不敢过，天快黑的时候对岸亮起一支手电，是阿木的爷爷，"},{"t":"裤腿挽到大腿根","em":true},{"t":"，慢慢蹚过来，先把表弟背了过去，又回来接他。"}]'),
('c0090000-0000-4000-8000-000000000003',6,0.81,'[{"t":"爷爷背着阿木走在前头，表弟跟在后面踩着爷爷的脚印，爷爷一路上只开了一次口：「下回水大就别回来了，在学校住着，我给你们送吃的去。」阿木趴在他背上，没敢接话。"}]'),
('c0090000-0000-4000-8000-000000000003',7,0.94,'[{"t":"阿木后来去县城读高中，回家改坐班车，再没走过那条山路，可他初一那年在宿舍墙上挂书包的那颗钉子一直跟着他，每换一次宿舍，他都把钉子拔下来带走，到了新地方再找块砖敲进墙里。"}]');

-- 牵手
delete from cove_beats where track_id='c0100000-0000-4000-8000-000000000001';
insert into cove_beats (track_id,ord,at,segments) values
('c0100000-0000-4000-8000-000000000001',1,0.03,'[{"t":"生于台北的苏芮在1993年发行了专辑《牵手》，同名的这首歌在网易云音乐上长五分四十五秒，此前整整十年，也就是1983年，她因为电影《搭错车》的原声带在台湾走红。"}]'),
('c0100000-0000-4000-8000-000000000001',2,0.17,'[{"t":"老林和阿芬结婚四十一年，跟着他的工作从漳州搬到厦门，又从厦门搬到泉州，每次搬家阿芬都把碗一只只用旧报纸包好，包完了才发现有的报纸是好几年前的。"}]'),
('c0100000-0000-4000-8000-000000000001',3,0.32,'[{"t":"退休那年儿子在泉州给他们买了一套一楼的小房子，带一个巴掌大的院子，老林一进门就蹲下去摸了摸院子里的土，说：「这土能种东西。」阿芬说：「你先把箱子搬进来再种。」"}]'),
('c0100000-0000-4000-8000-000000000001',4,0.47,'[{"t":"搬进去的头一个月两个人都睡不踏实，半夜听见楼上冲水的声音都会醒，老林躺在床上说：「这房子太静了，不像咱家。」阿芬就起身把旧家里那只"},{"t":"走起来咔嗒作响的闹钟","em":true},{"t":"翻出来，摆在了床头。"}]'),
('c0100000-0000-4000-8000-000000000001',5,0.62,'[{"t":"开春老林在院子里种了丝瓜，搭架子时阿芬在下面扶着竹竿，他在上面绑绳子，绑好一个结就问：「正不正？」她每次都说正，其实有两根歪得厉害，她想着等丝瓜爬上去就看不出来了。"}]'),
('c0100000-0000-4000-8000-000000000001',6,0.78,'[{"t":"到了夏天丝瓜结了满架，吃不完就分给邻居，楼上的年轻夫妻来道谢，问他们在这里住了多久，阿芬想了想说：「三个月吧。」老林在旁边纠正她：「三个月零十一天。」"}]'),
('c0100000-0000-4000-8000-000000000001',7,0.93,'[{"t":"那天晚上收拾碗筷，阿芬把柜子顶上最后一摞没拆的旧报纸拿下来扔了，老林问她：「以后搬家不用了？」她把碗一只只码进柜子，说：「不搬了，碗就放这儿，伸手就拿得到。」"}]');

-- 宝贝
delete from cove_beats where track_id='c0100000-0000-4000-8000-000000000002';
insert into cove_beats (track_id,ord,at,segments) values
('c0100000-0000-4000-8000-000000000002',1,0.03,'[{"t":"佳慧带着八个月大的女儿在高雄换过四个住处，最后租下的是盐埕一栋老公寓的四楼，没有电梯，她每天抱着孩子、拎着奶粉罐爬楼梯，爬到三楼转角都要停下来喘一口气。"}]'),
('c0100000-0000-4000-8000-000000000002',2,0.18,'[{"t":"房东是个七十多岁的阿嬷，签约那天看了看孩子，又看了看她，什么也没多问，只说：「楼梯那盏灯坏了很久，我明天就叫人来修，你抱着小孩不要摸黑走。」"}]'),
('c0100000-0000-4000-8000-000000000002',3,0.34,'[{"t":"搬进去的第一个周末，她把掉漆的铁门刷成了浅蓝色，刷到一半房东阿嬷上楼来，站在楼梯口看了很久，说：「这个颜色好，我年轻时候也想漆，我先生嫌太花。」"}]'),
('c0100000-0000-4000-8000-000000000002',4,0.50,'[{"t":"她在巷口的鱼丸店找了份工，早上六点做到十点，老板娘让她把女儿放在店后头的竹摇篮里，忙的时候几个阿姨轮流过去晃两下，女儿就在鱼汤的香味里长出了第一颗牙。"}]'),
('c0100000-0000-4000-8000-000000000002',5,0.66,'[{"t":"后来她在那间屋子里慢慢添了东西，一张从二手店扛回来的木头餐桌，一个晾小衣服的伸缩架，窗台上还有一盆房东阿嬷送的九层塔，掐一把就能丢进粥里。"}]'),
('c0100000-0000-4000-8000-000000000002',6,0.81,'[{"t":"第二年春天，她把信箱上前一个房客留下的名字条撕了，"},{"t":"用签字笔写上自己和女儿的名字","em":true},{"t":"，写完怕被雨淋花，又跑去文具店买了一卷透明胶带，在外面缠了好几道。"}]'),
('c0100000-0000-4000-8000-000000000002',7,0.94,'[{"t":"女儿会走路以后，最爱自己扶着栏杆往上爬，爬到三楼转角也要停下来，学着妈妈的样子大口喘气，喘完了回过头，冲着跟在后面的佳慧伸出一只小手，要拉她上去。"}]');

-- 这一切没有想象的那么糟
delete from cove_beats where track_id='c0100000-0000-4000-8000-000000000003';
insert into cove_beats (track_id,ord,at,segments) values
('c0100000-0000-4000-8000-000000000003',1,0.03,'[{"t":"周明在长沙开的装修公司倒掉以后，身上背了一笔债，他把能卖的都卖了，剩下的钱刚够在常德老城盘下一间卖米粉的小铺子，前一个老板留给他一口用了十年的大锅。"}]'),
('c0100000-0000-4000-8000-000000000003',2,0.19,'[{"t":"他不会煮粉，前一个老板答应教他一个月，头一天教熬汤，凌晨三点起来剔骨头，老板看他手忙脚乱，说：「你急什么，"},{"t":"骨头又不会跑","em":true},{"t":"，汤熬到天亮自然就好了。」"}]'),
('c0100000-0000-4000-8000-000000000003',3,0.36,'[{"t":"头半年生意冷清，一天卖不到五十碗，他把账记在一本小学生的作业本上，每天收摊以后坐在空铺子里一笔笔地算，算到最后总差一点，差的那一点就从自己的饭钱里扣。"}]'),
('c0100000-0000-4000-8000-000000000003',4,0.53,'[{"t":"有天早上来了一个他从前公司的客户，认出他以后愣了半天，问他怎么在这里，他一边往碗里加码子一边说：「在这里煮粉，你要辣的还是不辣的？」那人吃完多压了十块钱，他追出去还了。"}]'),
('c0100000-0000-4000-8000-000000000003',5,0.71,'[{"t":"第二年铺子门口开始排队，排的大多是附近上早班的人，他记住了好些人的口味，谁不要葱，谁要多一勺酸豆角，有个环卫工每天来得最早，他总先给她下粉，码子也多放一点。"}]'),
('c0100000-0000-4000-8000-000000000003',6,0.90,'[{"t":"债是第四年还清的，那天收摊以后他照旧坐下来算账，算完了在作业本最后一页写了个零，盯着看了一会儿，又在零的旁边歪歪扭扭地添了一只碗，碗上画了三道冒着的热气。"}]');


-- ------------------------------------------------------------
-- 4. 期刊（4 期，status='draft'，未发布，不置顶）
-- ------------------------------------------------------------

insert into cove_curations (id,issue_number,theme_zh,theme_en,intro,quote,quote_author,track_ids,is_special,status,published_at,is_featured,envelope_color) values
('e0070000-0000-4000-8000-000000000000',7,'方言里的海','The Sea in Our Dialects',
 '这一期的三首歌分别用闽南语、粤语和客家话唱成，故事里有海堤边合伙摆摊的两个女人、海鲜档里挑蟹的学徒和泥滩上剥蚵的老人，他们隔着海峡和山岭，各自在水边把日子一天天过下去。',
 null,null,
 array['c0070000-0000-4000-8000-000000000001','c0070000-0000-4000-8000-000000000002','c0070000-0000-4000-8000-000000000003']::uuid[],
 false,'draft',null,false,'blue')
on conflict (id) do nothing;

insert into cove_curations (id,issue_number,theme_zh,theme_en,intro,quote,quote_author,track_ids,is_special,status,published_at,is_featured,envelope_color) values
('e0080000-0000-4000-8000-000000000000',8,'灯下等人','Waiting Under the Lamp',
 '等待的时候人能做的事情其实很少，多半只是守在原地，找点手上的活做着，盼着时间快一点走完，这一期的三首歌陪的就是这样一些守到天亮才知道结果的夜晚。',
 null,null,
 array['c0080000-0000-4000-8000-000000000001','c0080000-0000-4000-8000-000000000002','c0080000-0000-4000-8000-000000000003']::uuid[],
 false,'draft',null,false,'kraft')
on conflict (id) do nothing;

insert into cove_curations (id,issue_number,theme_zh,theme_en,intro,quote,quote_author,track_ids,is_special,status,published_at,is_featured,envelope_color) values
('e0090000-0000-4000-8000-000000000000',9,'返乡','The Way Home',
 '回家这件事说起来简单，路上要想的事情往往比平时多，这一期的三首歌都在回家的路上，陪着人从出门一直走到推开家门、屋里的人抬起头来的那一刻。',
 null,null,
 array['c0090000-0000-4000-8000-000000000001','c0090000-0000-4000-8000-000000000002','c0090000-0000-4000-8000-000000000003']::uuid[],
 false,'draft',null,false,'red')
on conflict (id) do nothing;

insert into cove_curations (id,issue_number,theme_zh,theme_en,intro,quote,quote_author,track_ids,is_special,status,published_at,is_featured,envelope_color) values
('e0100000-0000-4000-8000-000000000000',10,'靠岸','Coming Ashore',
 '第十期讲的是安顿下来以后的日子，人停下来不再搬动，身边的东西才会慢慢添起来，日子也就有了自己的样子，这一期发布以后，灯塔最上面一层的灯室也会亮起来。',
 null,null,
 array['c0100000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000002','c0100000-0000-4000-8000-000000000003']::uuid[],
 false,'draft',null,false,'kraft')
on conflict (id) do nothing;

commit;

-- 自查（只读，落库后可跑）：
-- select status, count(*) from cove_tracks where id::text like 'c0%' group by status;
-- select issue_number, status, is_featured, published_at from cove_curations where issue_number between 7 and 10;
-- select track_id, count(*) from cove_beats where track_id::text like 'c0%' group by track_id order by track_id;
