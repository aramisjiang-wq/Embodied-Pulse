import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '全站搜索 - Embodied Pulse',
  description: '搜索具身智能领域的论文、视频、GitHub项目、HuggingFace模型和招聘信息',
  keywords: ['搜索', '具身智能搜索', '论文搜索', '视频搜索', 'GitHub搜索']
})
