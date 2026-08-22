import Link from 'next/link';
// 港口甲 · 独立门面
// 进了 /fangfei，海角的刊头隐掉（见 globals.css 里 body:has(.ff-root)），
// 诗社有自己的页头、导航和页脚；只在页脚留一行"寄宿于海角"。
export const metadata = { title: '港口甲', description: '一群写诗的人' };
export default function HarborALayout({ children }) {
  return (
    <div className="ff-root">
      <header className="ff-head">
        <Link href="/fangfei" className="ff-brand">
          <span className="ff-brand-cn">港口甲</span>
          <span className="ff-brand-en">Harbor A</span>
        </Link>
        <nav className="ff-nav">
          <Link href="/fangfei">诗</Link>
          <Link href="/fangfei/about">诗社</Link>
          <Link href="/fangfei/submit">投稿</Link>
          <Link href="/fangfei/desk">编辑台</Link>
        </nav>
      </header>
      {children}
      <footer className="ff-foot">
        <span>港口甲</span>
        <span className="ff-foot-sep">·</span>
        <span>寄宿于<Link href="/">海角 Cove</Link></span>
      </footer>
    </div>
  );
}
