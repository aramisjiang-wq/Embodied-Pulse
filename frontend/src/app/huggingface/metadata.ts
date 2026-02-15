import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: 'HuggingFace模型 - Embodied Pulse',
  description: '浏览具身智能领域的HuggingFace模型，包括视觉导航、机器人控制、多模态学习等',
  keywords: ['HuggingFace', '具身智能模型', 'Embodied AI', '机器学习模型', '预训练模型']
})
