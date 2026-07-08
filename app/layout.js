import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: '海角 Cove',
  description: '从海面下打捞每一首歌的故事。',
};

// 导航映射（同构摇篮：每日一展｜艺术阅览室｜作品集｜艺术家｜杂志社｜驻地｜合作伙伴）
// 摇篮                → 海角
// 每日一展            → 每日音乐节 /festival （制作人邀请函，召集乐手/歌手/词曲作者）
// 艺术阅览室          → 海角唱片行 /records
// 当代作品集          → 原创码头   /dock
// 艺术家              → 音乐人     /musicians
// 杂志社              → 海角电台   /radio    （主持人专访）
// 驻地                → 灯塔       /lighthouse（随内容积累逐层点亮）
// 合作伙伴            → 邻港       /harbors
const NAV = [
  { href: '/festival', label: '每日音乐节' },
  { href: '/records', label: '海角唱片行' },
  { href: '/dock', label: '原创码头' },
  { href: '/musicians', label: '音乐人' },
  { href: '/radio', label: '海角电台' },
  { href: '/lighthouse', label: '灯塔' },
  { href: '/harbors', label: '邻港' },
  { href: '/login', label: '靠岸' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="cove-bg" />

        <header className="band">
          <div className="eyebrow">从 海 面 下 打 捞 故 事</div>
          <Link className="logo" href="/">
            <span className="main"><span className="cn">海角</span>COVE</span>
            <span className="sub">COVE.GE</span>
          </Link>
          <div className="corner"><span className="num">角</span></div>
        </header>

        <nav className="cove-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>

        {children}
      </body>
    </html>
  );
}
