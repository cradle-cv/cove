'use client';
// 全站页脚：关于与几个还在筹备的去处。
// 管理端（/admin）和港口甲（/fangfei，有自己的页脚）不显示。
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FOOT = [
  { href: '/lighthouse/dock', label: '关于海角' },
  { href: '/harbors/open', label: '开一座港' },
  { href: '/support', label: '守塔人' },
  { href: '/goods', label: '海角好物' },
];

export default function SiteFooter() {
  const path = usePathname() || '';
  if (path.startsWith('/admin') || path.startsWith('/fangfei')) return null;
  return (
    <footer className="site-foot">
      {FOOT.map((n) => (
        <Link key={n.href} href={n.href}>{n.label}</Link>
      ))}
      <div className="sf-mark">COVE.GE</div>
    </footer>
  );
}
