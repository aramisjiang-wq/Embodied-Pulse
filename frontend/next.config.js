/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 优化编译输出
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 性能优化配置
  experimental: {
    optimizePackageImports: [
      'antd', 
      '@ant-design/icons', 
      'antd/es', 
      'antd/lib',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
    ],
    optimizeCss: true,
    scrollRestoration: true,
  },
  // 优化图片加载
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.hdslb.com',
      },
      {
        protocol: 'https',
        hostname: 'arxiv.org',
      },
    ],
    // 优化图片格式
    formats: ['image/avif', 'image/webp'],
    // 图片大小限制
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // API 代理
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  // 启用压缩
  compress: true,
  // 优化输出
  poweredByHeader: false,
  // 静态资源缓存优化
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
