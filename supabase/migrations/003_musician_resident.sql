-- 区分「入驻海角的音乐人」和「打捞碎月收录过歌的歌手」。
-- 外链品鉴的真实歌手只是被收录，不能显示成入驻。
-- 这里只标站长本人；其余已有的音乐人是否算入驻由站长决定；管理端目前没有这个开关，需要时在 SQL Editor 里执行一行 update。
alter table public.cove_musicians add column if not exists is_resident boolean not null default false;
update public.cove_musicians set is_resident = true where name = '夕帷';
