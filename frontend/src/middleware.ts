import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 注意：/subscriptions 和 /subscriptions-new 是两种不同的订阅模式
// /subscriptions - 关键词订阅（订阅关键词，系统搜索匹配内容推送）
// /subscriptions-new - 内容订阅（订阅具体内容，监控更新）

export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/subscriptions/:path*',
  ],
};
