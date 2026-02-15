import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReposPage from '@/app/repos/page'

jest.mock('@/lib/api/repo', () => ({
  repoApi: {
    getRepos: jest.fn(),
  },
}))

jest.mock('@/lib/api/content-subscription', () => ({
  contentSubscriptionApi: {
    getSubscriptions: jest.fn(),
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

jest.mock('@/components/RepoCard', () => {
  return function MockRepoCard() {
    return <div data-testid="repo-card">Repo Card</div>
  }
})

jest.mock('@/components/RepoListItem', () => {
  return function MockRepoListItem() {
    return <div data-testid="repo-list-item">Repo List Item</div>
  }
})

describe('Repos Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useAuthStore } = require('@/store/authStore')
    useAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    const { repoApi } = require('@/lib/api/repo')
    const { contentSubscriptionApi } = require('@/lib/api/content-subscription')
    repoApi.getRepos.mockResolvedValue({ items: [], pagination: { total: 0, hasNext: false } })
    contentSubscriptionApi.getSubscriptions.mockResolvedValue({ items: [] })

    render(<ReposPage />)
  })

  it('renders repos list after loading', async () => {
    const { repoApi } = require('@/lib/api/repo')
    const { contentSubscriptionApi } = require('@/lib/api/content-subscription')
    const mockRepos = [
      {
        id: '1',
        repoId: 123,
        name: 'test-repo',
        fullName: 'test/test-repo',
        description: 'Test description',
        starsCount: 100,
        forksCount: 50,
        language: 'TypeScript',
        topics: ['test'],
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ]
    repoApi.getRepos.mockResolvedValue({ 
      items: mockRepos, 
      pagination: { total: 1, hasNext: false } 
    })
    contentSubscriptionApi.getSubscriptions.mockResolvedValue({ items: [] })

    render(<ReposPage />)

    await waitFor(() => {
      expect(screen.getByTestId('repo-card')).toBeInTheDocument()
    })
  })
})
