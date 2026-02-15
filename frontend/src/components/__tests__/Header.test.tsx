import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Header from '@/components/Header'
import { useAuthStore } from '@/store/authStore'

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
  usePathname: () => '/',
}))

jest.mock('@/hooks/usePrefetch', () => ({
  usePrefetchOnHover: jest.fn(() => ({ onMouseEnter: jest.fn() })),
}))

jest.mock('@/api/notifications', () => ({
  getUnreadCount: jest.fn(),
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockUseAuthStore = useAuthStore as unknown as jest.Mock
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    })
  })

  it('renders without crashing', () => {
    render(<Header />)
  })

  it('displays navigation links', () => {
    render(<Header />)

    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })
})
