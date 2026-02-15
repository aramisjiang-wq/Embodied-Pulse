import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '@/app/page'

jest.mock('@/lib/api/feed', () => ({
  feedApi: {
    getFeed: jest.fn(),
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

jest.mock('@/components/DiscoveryModule', () => {
  return function MockDiscoveryModule() {
    return <div data-testid="discovery-module">Discovery Module</div>
  }
})

jest.mock('@/components/SubscriptionModule', () => {
  return function MockSubscriptionModule() {
    return <div data-testid="subscription-module">Subscription Module</div>
  }
})

jest.mock('@/lib/api/stats', () => ({
  statsApi: {
    getContentStats: jest.fn(),
  },
}))

jest.mock('@/lib/api/announcement', () => ({
  announcementApi: {
    getActiveAnnouncements: jest.fn(),
  },
}))

jest.mock('@/lib/api/home-module', () => ({
  homeModuleApi: {
    getHomeModules: jest.fn(),
  },
}))

jest.mock('@/lib/api/banner', () => ({
  bannerApi: {
    getActiveBanners: jest.fn(),
  },
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useAuthStore } = require('@/store/authStore')
    useAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    const { statsApi } = require('@/lib/api/stats')
    const { announcementApi } = require('@/lib/api/announcement')
    const { homeModuleApi } = require('@/lib/api/home-module')
    const { bannerApi } = require('@/lib/api/banner')
    
    statsApi.getContentStats.mockResolvedValue({
      papers: 0,
      videos: 0,
      repos: 0,
      huggingface: 0,
      jobs: 0,
    })
    announcementApi.getActiveAnnouncements.mockResolvedValue([])
    homeModuleApi.getHomeModules.mockResolvedValue({ items: [] })
    bannerApi.getActiveBanners.mockResolvedValue([])

    render(<Home />)
  })

  it('displays loading state', () => {
    const { statsApi } = require('@/lib/api/stats')
    const { announcementApi } = require('@/lib/api/announcement')
    const { homeModuleApi } = require('@/lib/api/home-module')
    const { bannerApi } = require('@/lib/api/banner')
    
    statsApi.getContentStats.mockImplementation(() => new Promise(() => {}))
    announcementApi.getActiveAnnouncements.mockImplementation(() => new Promise(() => {}))
    homeModuleApi.getHomeModules.mockImplementation(() => new Promise(() => {}))
    bannerApi.getActiveBanners.mockImplementation(() => new Promise(() => {}))

    render(<Home />)

    const spinElements = document.querySelectorAll('.ant-spin')
    expect(spinElements.length).toBeGreaterThan(0)
  })

  it('renders modules after loading', async () => {
    const { statsApi } = require('@/lib/api/stats')
    const { announcementApi } = require('@/lib/api/announcement')
    const { homeModuleApi } = require('@/lib/api/home-module')
    const { bannerApi } = require('@/lib/api/banner')
    
    statsApi.getContentStats.mockResolvedValue({
      papers: 100,
      videos: 200,
      repos: 300,
      huggingface: 400,
      jobs: 500,
    })
    announcementApi.getActiveAnnouncements.mockResolvedValue([])
    homeModuleApi.getHomeModules.mockResolvedValue({ items: [] })
    bannerApi.getActiveBanners.mockResolvedValue([])

    render(<Home />)

    await waitFor(() => {
      expect(screen.getByTestId('discovery-module')).toBeInTheDocument()
      expect(screen.getByTestId('subscription-module')).toBeInTheDocument()
    })
  })
})
