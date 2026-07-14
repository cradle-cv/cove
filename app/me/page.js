'use client';
// 「我的」· 统一面板
// 所有登录用户：个人资料、我的投稿、个人主页链接。
// 按身份点亮：词曲者→工作台入口；制作人/机构→邀请函管理；管理员→后台入口。
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ImageUploader from '@/components/ImageUploader';

const ROLE_CN = { songwriter: '词曲者', performer: '歌手/乐手', producer: '制作人', organization: '音乐机构' };

export default function MePage() {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('profile');

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from('users')
      .select('*').eq('auth_id', uid).maybeSingle();
    setProfile(data || {});
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (u) loadProfile(u.id);
    });
  }, [loadProfile]);

  if (user === undefined) return <main className="sheet"><p className="dredging">正在核对身份</p></main>;
  if (!user) {
    return (
      <main className="sheet">
        <div className="sheet-head"><div className="no">Me</div><div className="th">我的</div>
          <div className="sub">先<Link href="/login" style={{ margin: '0 4px' }}>靠岸</Link>。</div>
          <div className="hairline" /></div>
      </main>
    );
  }

  const roles = profile?.roles || [];
  const isAdmin = profile?.role === 'admin';
  const isProducer = roles.includes('producer') || roles.includes('organization');

  const TABS = [
    ['profile', '个人资料'],
    ['posts', '我的投稿'],
    roles.includes('songwriter') || isAdmin ? ['studio', '工作台'] : null,
    isProducer || isAdmin ? ['invites', '邀请函'] : null,
    ['page', '个人主页'],
    isAdmin ? ['admin', '后台'] : null,
  ].filter(Boolean);

  return (
    <main className="sheet">
      <div className="sheet-head">
        <div className="no">Me</div>
        <div className="th">我的</div>
        <div className="sub">{profile?.username || user.email}</div>
        <div className="hairline" />
      </div>

      <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, margin: '6px 0 34px' }}>
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              background: tab === k ? 'rgba(93,154,143,.18)' : 'transparent',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 13.5,
              letterSpacing: '.1em',
              color: tab === k ? 'var(--ink)' : 'var(--ink-soft)',
              cursor: 'pointer',
              padding: '8px 18px',
              borderRadius: 20,
              transition: 'background .2s, color .2s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="me-body">
        {tab === 'profile' && <ProfileTab profile={profile} user={user} onSaved={() => loadProfile(user.id)} />}
        {tab === 'posts' && <PostsTab user={user} />}
        {tab === 'studio' && <JumpTab href="/studio" label="进入词曲工作台" desc="上传词与曲，用 AI 生成小样。" />}
        {tab === 'invites' && <InvitesTab user={user} />}
        {tab === 'page' && <PageTab profile={profile} />}
        {tab === 'admin' && <JumpTab href="/admin" label="进入管理室" desc="海玻璃审核、身份申请、排期等。" />}
      </div>
    </main>
  );
}

// ---------- 个人资料 ----------
function ProfileTab({ profile, user, onSaved }) {
  const [f, setF] = useState({
    username: profile?.username || '',
    handle: profile?.handle || '',
    bio: profile?.bio || '',
    links: profile?.links || '',
    avatar_url: profile?.avatar_url || '',
  });
  const [msg, setMsg] = useState('');

  async function save() {
    setMsg('正在保存…');
    const handle = (f.handle || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const { error } = await supabase.from('users').update({
      username: f.username.trim() || null,
      handle: handle || null,
      bio: f.bio.trim() || null,
      links: f.links.trim() || null,
      avatar_url: f.avatar_url.trim() || null,
    }).eq('auth_id', user.id);
    if (error) {
      setMsg(error.message.includes('users_handle_unique') ? '这个主页地址已被占用，换一个' : '保存失败：' + error.message);
      return;
    }
    setMsg('已保存'); onSaved?.();
  }

  return (
    <div className="cove-form" style={{ maxWidth: 520, margin: '0 auto' }}>
      <label>显示名字</label>
      <input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />

      <label>主页地址（英文/数字，用于 cove.ge/u/你的地址）</label>
      <input value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} placeholder="例如 seeway" />

      <label>头像</label>
      <ImageUploader
        value={f.avatar_url}
        onDone={({ url }) => setF((p) => ({ ...p, avatar_url: url }))}
      />

      <label>简介</label>
      <textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />

      <label>外部链接（网易云 / B站 / 个人页，可不填）</label>
      <input value={f.links} onChange={(e) => setF({ ...f, links: e.target.value })} />

      <div className="form-msg">{msg}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn" onClick={save}>保存</button>
      </div>
    </div>
  );
}

// ---------- 我的投稿（海玻璃） ----------
function PostsTab({ user }) {
  const [poems, setPoems] = useState(null);
  useEffect(() => {
    supabase.from('cove_poems').select('*').eq('author_auth_id', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setPoems(data || []));
  }, [user.id]);

  const STATUS_CN = { pending: '审核中', published: '已发布', hidden: '已隐藏' };
  if (poems === null) return <p className="dredging">正在取</p>;
  if (poems.length === 0) return (
    <p className="dredging">还没有投稿。<Link href="/glass/submit">去海玻璃放一枚 →</Link></p>
  );
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {poems.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0',
          borderBottom: '1px solid var(--hair)' }}>
          <strong style={{ fontSize: 15 }}>{p.title}</strong>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {Array.isArray(p.audio_src) && p.audio_src.length ? '有音乐' : '无音乐'}
          </span>
          <span style={{ flex: 1 }} />
          <span className={'status-pill' + (p.status === 'published' ? ' pub' : '')}>{STATUS_CN[p.status]}</span>
          {p.status === 'published' ? <Link href={`/glass/${p.id}`} style={{ fontSize: 12 }}>查看</Link> : null}
        </div>
      ))}
    </div>
  );
}

// ---------- 邀请函管理（制作人/机构） ----------
function InvitesTab({ user }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    supabase.from('cove_festivals').select('*').eq('created_by', user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setItems(data || []));
  }, [user.id]);
  const TYPE_CN = { gig_call: '演出征人', band_recruit: '乐团招募', venue_offer: '场地承接' };
  if (items === null) return <p className="dredging">正在取</p>;
  if (items.length === 0) return (
    <p className="dredging">还没有发起过邀请函。<Link href="/festival">去每日演出看看 →</Link></p>
  );
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      {items.map((f) => (
        <div key={f.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--hair)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{TYPE_CN[f.invite_type]}</span>
            <strong style={{ fontSize: 15 }}>{f.title}</strong>
            <span style={{ flex: 1 }} />
            <Link href={`/festival/${f.id}`} style={{ fontSize: 12 }}>查看报名</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- 个人主页链接 ----------
function PageTab({ profile }) {
  if (!profile?.handle) return (
    <p className="dredging">先在「个人资料」里设一个主页地址，就有对外主页了。</p>
  );
  const url = `/u/${profile.handle}`;
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 16 }}>你的对外主页：</p>
      <Link href={url} className="btn">打开 cove.ge{url}</Link>
    </div>
  );
}

function JumpTab({ href, label, desc }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 16 }}>{desc}</p>
      <Link href={href} className="btn">{label}</Link>
    </div>
  );
}
