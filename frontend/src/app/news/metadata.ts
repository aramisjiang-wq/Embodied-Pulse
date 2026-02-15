import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '行业新闻 - Embodied Pulse',
  description: '获取具身智能领域的最新新闻和行业动态',
  keywords: ['具身智能新闻', 'AI新闻', '机器人行业', '行业动态', '科技新闻']
})
