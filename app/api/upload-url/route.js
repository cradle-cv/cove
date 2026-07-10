// 生成 R2 预签名上传 URL
// 浏览器不能直接持有 R2 密钥，所以由服务端签发一个短时有效的上传许可，
// 前端拿着它把文件直传 R2（不经过我们的服务器，省流量也省时间）。
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB 上限
const ALLOWED = {
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
};

export async function POST(req) {
  const { filename, contentType, size } = await req.json().catch(() => ({}));

  if (!filename || !contentType) {
    return NextResponse.json({ error: '缺少文件名或类型' }, { status: 400 });
  }
  if (!ALLOWED[contentType]) {
    return NextResponse.json({ error: '只接受 mp3 / webm / ogg 音频' }, { status: 400 });
  }
  if (typeof size === 'number' && size > MAX_BYTES) {
    return NextResponse.json({ error: `文件超过 10MB（当前 ${(size / 1048576).toFixed(1)}MB）` }, { status: 400 });
  }

  const {
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
    R2_BUCKET = 'cove',
    NEXT_PUBLIC_R2_PUBLIC_URL,
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: '服务端未配置 R2 密钥' }, { status: 500 });
  }

  // 清洗文件名：只留字母数字连字符，避免 URL 编码问题
  const ext = ALLOWED[contentType];
  const base = String(filename)
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9\-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'track';
  const key = `covemusic/${base}-${Date.now().toString(36)}${ext}`;

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 600 }
  );

  const publicUrl = `${(NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`;
  return NextResponse.json({ uploadUrl, publicUrl, key });
}
