import express from 'express'

const router = express.Router()

router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /settings
Disallow: /profile

Sitemap: https://embodiedpulse.com/api/seo/sitemap.xml`
  
  res.set('Content-Type', 'text/plain')
  res.send(robots)
})

export default router
