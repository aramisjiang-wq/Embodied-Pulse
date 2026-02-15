import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FeedCard from '@/components/FeedCard'
import { Paper, FeedItem } from '@/lib/api/types'

const mockPaper: Paper = {
  id: '1',
  arxivId: '2401.12345',
  title: 'Test Paper',
  authors: ['Test Author'],
  abstract: 'Test abstract',
  publishedDate: '2024-01-15',
  citationCount: 100,
  categories: ['test'],
  viewCount: 0,
  favoriteCount: 0,
  shareCount: 0,
}

const mockFeedItem: FeedItem = {
  id: '1',
  type: 'paper',
  data: mockPaper,
  createdAt: '2024-01-15T00:00:00Z',
}

describe('FeedCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<FeedCard item={mockFeedItem} />)
  })

  it('displays paper title', () => {
    render(<FeedCard item={mockFeedItem} />)

    expect(screen.getByText('Test Paper')).toBeInTheDocument()
  })

  it('displays paper author', () => {
    render(<FeedCard item={mockFeedItem} />)

    expect(screen.getByText('Test Author')).toBeInTheDocument()
  })
})
