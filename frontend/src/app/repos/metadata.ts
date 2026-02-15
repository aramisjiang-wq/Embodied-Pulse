import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '具身智能GitHub项目 - Embodied Pulse',
  description: '发现优秀的具身智能开源项目，包括机器人仿真、强化学习、视觉导航等',
  keywords: ['具身智能项目', 'Embodied AI GitHub', '机器人开源', '仿真平台', '开源项目']
})
