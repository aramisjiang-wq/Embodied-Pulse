import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import VideosPage from '@/app/videos/page'

jest.mock('@/lib/api/video', () => ({
  videoApi: {
    getVideos: jest.fn(),
    getUploaders: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('dayjs', () => {
  const actualDayjs = jest.requireActual('dayjs')
  const mockDayjs = (date: any) => {
    const dayjsInstance = actualDayjs(date)
    dayjsInstance.fromNow = jest.fn(() => '刚刚')
    return dayjsInstance
  }
  Object.assign(mockDayjs, actualDayjs)
  return mockDayjs
})

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

describe('Videos Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useAuthStore } = require('@/store/authStore')
    useAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    const { videoApi } = require('@/lib/api/video')
    videoApi.getVideos.mockResolvedValue({ items: [], pagination: { total: 0, hasNext: false } })
    videoApi.getUploaders.mockResolvedValue([])

    render(<VideosPage />)
  })

  it('displays loading state', () => {
    const { videoApi } = require('@/lib/api/video')
    videoApi.getVideos.mockImplementation(() => new Promise(() => {}))
    videoApi.getUploaders.mockResolvedValue([])

    render(<VideosPage />)

    const loadingCards = document.querySelectorAll('.ant-card-loading')
    expect(loadingCards.length).toBeGreaterThan(0)
  })

  it('renders videos list after loading', async () => {
    const { videoApi } = require('@/lib/api/video')
    const mockVideos = [
      {
        id: '1',
        title: 'Test Video',
        description: 'Test description',
        coverUrl: 'https://example.com/thumb.jpg',
        duration: 600,
        viewCount: 1000,
        uploader: 'Test Channel',
        publishedDate: '2024-01-15T10:00:00Z',
        tags: ['test'],
        videoId: 'test123',
        platform: 'bilibili',
      },
    ]
    videoApi.getVideos.mockResolvedValue({ 
      items: mockVideos, 
      pagination: { total: 1, hasNext: false } 
    })
    videoApi.getUploaders.mockResolvedValue([])

    render(<VideosPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument()
    })
  })
})
