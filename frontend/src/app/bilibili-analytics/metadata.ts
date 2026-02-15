import { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/metadata'

export const metadata: Metadata = generateSEOMetadata({
  title: 'B站数据分析 - Embodied Pulse',
  description: '查看B站具身智能相关视频的数据分析，包括播放量热力图、发布趋势和UP主排行榜',
  keywords: ['B站分析', '视频数据', 'UP主排行', '播放量分析', '具身智能']
})
