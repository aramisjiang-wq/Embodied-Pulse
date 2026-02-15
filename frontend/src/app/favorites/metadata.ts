import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '我的收藏 - Embodied Pulse',
  description: '查看和管理你收藏的论文、视频、GitHub项目和HuggingFace模型',
  keywords: ['收藏', '我的收藏', '书签', '具身智能']
})
