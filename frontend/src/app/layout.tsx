import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import RootLayoutClient from './layout-client';
import './globals.css';
import { generateSEOMetadata, generateWebSiteJsonLd } from '@/lib/metadata';
import JsonLd from '@/components/JsonLd';

const inter = Inter({ subsets: ['latin'], preload: false });

export const metadata: Metadata = generateSEOMetadata({
  title: 'Embodied Pulse - 具身智能一站式聚合平台',
  description: '聚合具身智能领域的论文、视频、GitHub项目、HuggingFace模型和招聘信息',
  keywords: ['具身智能', 'Embodied AI', '机器人', '论文', '视频', 'GitHub', 'HuggingFace', '招聘']
});

// 在模块级别生成 JSON-LD，避免在组件渲染时出错
let websiteJsonLdData: Record<string, unknown> = {};
try {
  const websiteJsonLd = generateWebSiteJsonLd(process.env.NEXT_PUBLIC_BASE_URL || 'https://embodiedpulse.com');
  websiteJsonLdData = JSON.parse(websiteJsonLd);
} catch (error) {
  // 静默失败，使用空对象
  websiteJsonLdData = {};
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <JsonLd data={websiteJsonLdData} />
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
