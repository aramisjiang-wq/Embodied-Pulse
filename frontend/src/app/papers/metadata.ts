import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '具身智能论文 - Embodied Pulse',
  description: '浏览最新的具身智能领域论文，包括机器人控制、视觉导航、多模态学习等研究方向',
  keywords: ['具身智能论文', 'Embodied AI', '机器人论文', 'arXiv', '计算机视觉', '人工智能']
})
