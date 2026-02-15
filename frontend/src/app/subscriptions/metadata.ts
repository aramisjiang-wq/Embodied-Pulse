import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: '我的订阅 - Embodied Pulse',
  description: '管理你的内容订阅，获取最新的论文、视频、GitHub项目推送',
  keywords: ['订阅', '内容订阅', '推送', '具身智能']
})
