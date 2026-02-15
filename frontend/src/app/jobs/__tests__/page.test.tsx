import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import JobsPage from '../page'

jest.mock('@/lib/api/job', () => ({
  jobApi: {
    getJobs: jest.fn(),
  },
}))

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/api/community', () => ({
  communityApi: {
    getPosts: jest.fn(),
  },
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

describe('JobsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useAuthStore } = require('@/store/authStore')
    useAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    const { jobApi } = require('@/lib/api/job')
    jobApi.getJobs.mockResolvedValue({ items: [], pagination: { total: 0, hasNext: false } })

    render(<JobsPage />)
  })

  it('renders jobs list after loading', async () => {
    const { jobApi } = require('@/lib/api/job')
    const mockJobs = [
      {
        id: '1',
        title: 'Test Job',
        company: 'Test Company',
        location: 'Remote',
        salary: '100000-150000',
        tags: ['test'],
        description: 'Test description',
        createdAt: '2024-01-15T10:00:00Z',
      },
    ]
    jobApi.getJobs.mockResolvedValue({ 
      items: mockJobs, 
      pagination: { total: 1, hasNext: false } 
    })

    render(<JobsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument()
    })
  })
})
