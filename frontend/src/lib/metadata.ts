import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  noIndex?: boolean
  publishedTime?: string
  modifiedTime?: string
  author?: string[]
}

export function generateSEOMetadata(config: SEOConfig): Metadata {
  const { title, description, keywords, ogImage, noIndex } = config

  return {
    title: truncate(title, 60),
    description: truncate(description, 160),
    keywords: keywords?.join(', '),
    openGraph: {
      title: truncate(title, 60),
      description: truncate(description, 160),
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
      type: 'website',
      siteName: 'Embodied Pulse'
    },
    twitter: {
      card: 'summary_large_image',
      title: truncate(title, 60),
      description: truncate(description, 160),
      images: ogImage ? [{ url: ogImage }] : undefined
    },
    robots: noIndex ? 'noindex, nofollow' : 'index, follow'
  }
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
}

export function generateSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  return `${slug}-${id}`
}

export function parseSlug(slug: string): { id: string } {
  const parts = slug.split('-')
  const id = parts[parts.length - 1]
  return { id }
}

export function generatePaperMetadata(paper: {
  id: string
  title: string
  abstract: string
  authors: string[]
  publishedDate: string
  updatedAt?: string
}): Metadata {
  return generateSEOMetadata({
    title: paper.title,
    description: paper.abstract,
    keywords: [...paper.authors, '具身智能', '论文', 'Embodied AI'],
    publishedTime: paper.publishedDate,
    modifiedTime: paper.updatedAt,
    author: paper.authors
  })
}

export function generateVideoMetadata(video: {
  id: string
  title: string
  description: string
  uploader: string
  platform: string
  publishedDate: string
}): Metadata {
  return generateSEOMetadata({
    title: video.title,
    description: video.description,
    keywords: [video.uploader, video.platform, '具身智能', '视频', '教程'],
    publishedTime: video.publishedDate,
    author: [video.uploader]
  })
}

export function generateRepoMetadata(repo: {
  id: string
  name: string
  description: string
  owner: string
  language: string
  createdAt: string
}): Metadata {
  return generateSEOMetadata({
    title: `${repo.owner}/${repo.name} - ${repo.language}`,
    description: repo.description,
    keywords: [repo.owner, repo.name, repo.language, 'GitHub', '开源', '具身智能'],
    publishedTime: repo.createdAt,
    author: [repo.owner]
  })
}

export function generateJobMetadata(job: {
  id: string
  title: string
  description: string
  company: string
  location: string
  createdAt: string
}): Metadata {
  return generateSEOMetadata({
    title: `${job.title} - ${job.company}`,
    description: job.description,
    keywords: [job.company, job.location, job.title, '招聘', '具身智能'],
    publishedTime: job.createdAt,
    author: [job.company]
  })
}

export function generateNewsMetadata(news: {
  id: string
  title: string
  content: string
  source: string
  publishedDate: string
}): Metadata {
  return generateSEOMetadata({
    title: news.title,
    description: news.content.substring(0, 160),
    keywords: [news.source, '新闻', '具身智能', '行业动态'],
    publishedTime: news.publishedDate,
    author: [news.source]
  })
}

export function generatePostMetadata(post: {
  id: string
  title: string
  content: string
  author: string
  createdAt: string
}): Metadata {
  return generateSEOMetadata({
    title: post.title,
    description: post.content.substring(0, 160),
    keywords: ['社区', '讨论', post.author, '具身智能'],
    publishedTime: post.createdAt,
    author: [post.author]
  })
}

export function generateUserProfileMetadata(user: {
  id: string
  username: string
  bio?: string
}): Metadata {
  return generateSEOMetadata({
    title: `${user.username} 的主页 - Embodied Pulse`,
    description: user.bio || `查看 ${user.username} 的个人主页、论文、帖子和收藏`,
    keywords: [user.username, '用户主页', '具身智能'],
    noIndex: false
  })
}

export function generateCommunityMetadata(): Metadata {
  return generateSEOMetadata({
    title: '社区市集 - Embodied Pulse',
    description: '具身智能社区，分享技术讨论、资源分享、求职招聘和活动交流',
    keywords: ['社区', '讨论', '技术交流', '具身智能']
  })
}

export function generateRankingsMetadata(): Metadata {
  return generateSEOMetadata({
    title: '热门榜单 - Embodied Pulse',
    description: '查看具身智能领域的热门帖子、活跃用户和热门内容',
    keywords: ['热门', '榜单', '排行榜', '具身智能']
  })
}

export interface JsonLdProps {
  type: string
  data: Record<string, unknown>
}

export function generateJsonLd(props: JsonLdProps): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': props.type,
    ...props.data
  })
}

export function generateWebSiteJsonLd(url: string): string {
  return generateJsonLd({
    type: 'WebSite',
    data: {
      '@id': url,
      url: url,
      name: 'Embodied Pulse',
      description: '具身智能领域的信息流平台，聚合论文、GitHub、HuggingFace、视频、求职等资源',
      inLanguage: 'zh-CN',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  })
}

export function generateArticleJsonLd(data: {
  headline: string
  description: string
  image?: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
}): string {
  return generateJsonLd({
    type: 'Article',
    data: {
      '@id': data.url,
      headline: data.headline,
      description: data.description,
      image: data.image,
      author: {
        '@type': 'Person',
        name: data.author
      },
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      url: data.url,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url
      }
    }
  })
}

export function generateVideoObjectJsonLd(data: {
  name: string
  description: string
  thumbnailUrl?: string
  uploadDate: string
  author: string
  url: string
}): string {
  return generateJsonLd({
    type: 'VideoObject',
    data: {
      '@id': data.url,
      name: data.name,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      uploadDate: data.uploadDate,
      author: {
        '@type': 'Person',
        name: data.author
      },
      url: data.url
    }
  })
}

export function generateSoftwareSourceCodeJsonLd(data: {
  name: string
  description: string
  author: string
  codeRepository: string
  programmingLanguage: string
  url: string
}): string {
  return generateJsonLd({
    type: 'SoftwareSourceCode',
    data: {
      '@id': data.url,
      name: data.name,
      description: data.description,
      author: {
        '@type': 'Person',
        name: data.author
      },
      codeRepository: data.codeRepository,
      programmingLanguage: data.programmingLanguage,
      url: data.url
    }
  })
}

export function generateJobPostingJsonLd(data: {
  title: string
  description: string
  company: string
  location: string
  datePosted: string
  url: string
}): string {
  return generateJsonLd({
    type: 'JobPosting',
    data: {
      '@id': data.url,
      title: data.title,
      description: data.description,
      hiringOrganization: {
        '@type': 'Organization',
        name: data.company
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: data.location
        }
      },
      datePosted: data.datePosted,
      url: data.url
    }
  })
}

export function generatePersonJsonLd(data: {
  name: string
  description?: string
  url: string
  image?: string
}): string {
  return generateJsonLd({
    type: 'Person',
    data: {
      '@id': data.url,
      name: data.name,
      description: data.description,
      url: data.url,
      image: data.image
    }
  })
}

export function generateBreadcrumbListJsonLd(items: Array<{ name: string, url: string }>): string {
  return generateJsonLd({
    type: 'BreadcrumbList',
    data: {
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    }
  })
}
