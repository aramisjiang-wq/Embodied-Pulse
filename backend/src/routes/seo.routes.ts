import express from 'express'
import userPrismaAny from '../config/database.user'

const router = express.Router()
const userPrisma = userPrismaAny as any;

interface SitemapEntry {
  id: string
  updatedAt: Date | null
  lastmod?: string
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || 'https://embodiedpulse.com'
    const currentDate = new Date().toISOString()
    
    const [papers, videos, repos, huggingface, jobs, news, posts]: [SitemapEntry[], SitemapEntry[], SitemapEntry[], SitemapEntry[], SitemapEntry[], SitemapEntry[], SitemapEntry[]] = await Promise.all([
      userPrisma.paper.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000
      }),
      userPrisma.video.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000
      }),
      userPrisma.githubRepo.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000
      }),
      userPrisma.huggingFaceModel.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1000
      }),
      userPrisma.job.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 500
      }),
      userPrisma.news.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 500
      }),
      userPrisma.post.findMany({
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 500
      })
    ])
    
    const staticUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
      { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/papers`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/videos`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/repos`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/huggingface`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/jobs`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/news`, priority: '0.8', changefreq: 'daily' },
      { loc: `${baseUrl}/community`, priority: '0.7', changefreq: 'daily' },
      { loc: `${baseUrl}/search`, priority: '0.6', changefreq: 'weekly' },
      { loc: `${baseUrl}/bilibili-analytics`, priority: '0.5', changefreq: 'weekly' }
    ]
    
    const paperUrls = papers.map(p => ({
      loc: `${baseUrl}/papers/${p.id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: p.updatedAt?.toISOString() || currentDate
    }))
    
    const videoUrls = videos.map(v => ({
      loc: `${baseUrl}/videos/${v.id}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: v.updatedAt?.toISOString() || currentDate
    }))
    
    const repoUrls = repos.map(r => ({
      loc: `${baseUrl}/repos/${r.id}`,
      priority: '0.7',
      changefreq: 'weekly',
      lastmod: r.updatedAt?.toISOString() || currentDate
    }))
    
    const huggingfaceUrls = huggingface.map(h => ({
      loc: `${baseUrl}/huggingface/${h.id}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: h.updatedAt?.toISOString() || currentDate
    }))
    
    const jobUrls = jobs.map(j => ({
      loc: `${baseUrl}/jobs/${j.id}`,
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: j.updatedAt?.toISOString() || currentDate
    }))
    
    const newsUrls = news.map(n => ({
      loc: `${baseUrl}/news/${n.id}`,
      priority: '0.5',
      changefreq: 'weekly',
      lastmod: n.updatedAt?.toISOString() || currentDate
    }))
    
    const postUrls = posts.map(p => ({
      loc: `${baseUrl}/community/${p.id}`,
      priority: '0.5',
      changefreq: 'weekly',
      lastmod: p.updatedAt?.toISOString() || currentDate
    }))
    
    const allUrls = [
      ...staticUrls,
      ...paperUrls,
      ...videoUrls,
      ...repoUrls,
      ...huggingfaceUrls,
      ...jobUrls,
      ...newsUrls,
      ...postUrls
    ]
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`
    
    res.set('Content-Type', 'application/xml')
    res.send(sitemap)
  } catch (error) {
    console.error('Error generating sitemap:', error)
    res.status(500).send('Error generating sitemap')
  }
})

export default router
