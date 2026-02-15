import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PapersPage from '@/app/papers/page'

jest.mock('@/lib/api/paper', () => ({
  paperApi: {
    getPapers: jest.fn(),
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

describe('Papers Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useAuthStore } = require('@/store/authStore')
    useAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    const { paperApi } = require('@/lib/api/paper')
    paperApi.getPapers.mockResolvedValue({ items: [], pagination: { total: 0, hasNext: false } })

    render(<PapersPage />)
  })

  it('displays loading state', () => {
    const { paperApi } = require('@/lib/api/paper')
    paperApi.getPapers.mockImplementation(() => new Promise(() => {}))

    render(<PapersPage />)

    const skeletonElements = document.querySelectorAll('.ant-skeleton')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  it('renders papers list after loading', async () => {
    const { paperApi } = require('@/lib/api/paper')
    const mockPapers = [
      {
        id: '1',
        title: 'Test Paper',
        authors: ['Test Author'],
        abstract: 'Test abstract',
        publishedDate: '2024-01-15',
        arxivId: '2401.12345',
        citations: 100,
        tags: ['test'],
      },
    ]
    paperApi.getPapers.mockResolvedValue({ 
      items: mockPapers, 
      pagination: { total: 1, hasNext: false } 
    })

    render(<PapersPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Paper')).toBeInTheDocument()
    })
  })
})
