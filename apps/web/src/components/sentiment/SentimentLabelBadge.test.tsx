import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SentimentLabel, SENTIMENT_COLORS } from '@movie-sentiment/shared'
import { SentimentLabelBadge } from './SentimentLabelBadge'

describe('SentimentLabelBadge', () => {
  it('renders a positive label with capitalized text', () => {
    render(<SentimentLabelBadge label={SentimentLabel.positive} />)
    expect(screen.getByText('Positive')).toBeInTheDocument()
  })

  it('renders a negative label', () => {
    render(<SentimentLabelBadge label={SentimentLabel.negative} />)
    expect(screen.getByText('Negative')).toBeInTheDocument()
  })

  it('renders a neutral label', () => {
    render(<SentimentLabelBadge label={SentimentLabel.neutral} />)
    expect(screen.getByText('Neutral')).toBeInTheDocument()
  })

  it('applies the sentiment color as foreground style', () => {
    render(<SentimentLabelBadge label={SentimentLabel.positive} />)
    const badge = screen.getByText('Positive')
    expect(badge).toHaveStyle({ color: SENTIMENT_COLORS[SentimentLabel.positive] })
  })

  it('merges optional className with default classes', () => {
    render(
      <SentimentLabelBadge label={SentimentLabel.positive} className="custom-extra" />
    )
    const badge = screen.getByText('Positive')
    expect(badge.className).toContain('custom-extra')
    expect(badge.className).toContain('rounded-full')
  })
})
