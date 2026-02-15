import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '招聘岗位 - Embodied Pulse',
  description: '查找具身智能领域的招聘信息，包括算法工程师、机器人研究员、视觉算法等岗位',
  keywords: ['具身智能招聘', '机器人招聘', 'AI招聘', '算法工程师', '研究员岗位']
})
