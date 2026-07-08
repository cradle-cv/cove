import { notFound } from 'next/navigation';
import { fetchIssue } from '@/lib/supabase';
import RecordShopClient from './RecordShopClient';

export const revalidate = 300;

// ⚠ Next.js 16：服务端动态路由的 params 是 Promise，必须 await
// （项目规范：const { id } = await params，直接 params.id 会得到 undefined → 404）
export default async function IssuePage({ params }) {
  const { id } = await params;
  const issue = await fetchIssue(id);
  if (!issue) notFound();
  return <RecordShopClient issue={issue} />;
}
