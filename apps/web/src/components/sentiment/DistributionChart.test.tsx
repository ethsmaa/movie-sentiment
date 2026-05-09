import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SentimentLabel, type DistributionDTO } from '@movie-sentiment/shared'
import { DistributionChart } from './DistributionChart'

const fixture: DistributionDTO = {
  buckets: [
    { label: SentimentLabel.positive, count: 60, percentage: 60 },
    { label: SentimentLabel.negative, count: 30, percentage: 30 },
    { label: SentimentLabel.neutral, count: 10, percentage: 10 },
  ],
}

describe('DistributionChart', () => {
  it('renders the section heading', () => {
    render(<DistributionChart distribution={fixture} />)
    expect(screen.getByText('Sentiment Split')).toBeInTheDocument()
  })

  it('renders short labels for every bucket', () => {
    render(<DistributionChart distribution={fixture} />)
    expect(screen.getByText('POS')).toBeInTheDocument()
    expect(screen.getByText('NEG')).toBeInTheDocument()
    expect(screen.getByText('NEU')).toBeInTheDocument()
  })

  it('renders the count for each bucket', () => {
    render(<DistributionChart distribution={fixture} />)
    expect(screen.getByText('60')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders percentages as labels', () => {
    render(<DistributionChart distribution={fixture} />)
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('renders nothing-but-heading when buckets array is empty', () => {
    render(<DistributionChart distribution={{ buckets: [] }} />)
    expect(screen.getByText('Sentiment Split')).toBeInTheDocument()
    expect(screen.queryByText('POS')).not.toBeInTheDocument()
  })
})
