import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '具身智能视频 - Embodied Pulse',
  description: '观看具身智能相关的视频教程，包括B站、YouTube等平台的优质内容',
  keywords: ['具身智能视频', '机器人教程', 'Embodied AI视频', 'B站', 'YouTube', '视频教程']
})
