// 管理端 · 重置用户密码
// 需要 service_role key（仅服务端可见），并校验调用者本人是管理员。
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { callerToken, userId, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });
    }
    if (!callerToken || !userId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 1) 校验调用者是管理员（用它的 access token 反查身份）
    const { data: caller } = await admin.auth.getUser(callerToken);
    const callerAuthId = caller?.user?.id;
    if (!callerAuthId) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const { data: callerRow } = await admin.from('users')
      .select('role').eq('auth_id', callerAuthId).maybeSingle();
    if (callerRow?.role !== 'admin') {
      return NextResponse.json({ error: '只有管理员可以重置密码' }, { status: 403 });
    }

    // 2) 找到目标用户的 auth_id
    const { data: target } = await admin.from('users')
      .select('auth_id').eq('id', userId).maybeSingle();
    if (!target?.auth_id) return NextResponse.json({ error: '用户不存在或未绑定登录' }, { status: 404 });

    // 3) 用 admin API 改密码
    const { error } = await admin.auth.admin.updateUserById(target.auth_id, {
      password: newPassword,
    });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || '重置失败' }, { status: 500 });
  }
}
