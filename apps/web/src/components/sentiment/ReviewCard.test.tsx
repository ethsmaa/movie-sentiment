import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  SentimentLabel,
  BERT_MODEL_VERSION,
  type ReviewWithSentimentDTO,
} from '@movie-sentiment/shared'
import { ReviewCard } from './ReviewCard'

function makeReview(overrides: Partial<ReviewWithSentimentDTO> = {}): ReviewWithSentimentDTO {
  return {
    id: 'r1',
    externalId: 'ext-r1',
    movieId: 'm1',
    author: 'Casey',
    text: 'A truly amazing film with brilliant performances.',
    rating: 9.4,
    createdAt: '2026-01-01T00:00:00Z',
    analysis: {
      id: 's1',
      reviewId: 'r1',
      label: SentimentLabel.positive,
      confidenceScore: 0.92,
      positiveProb: 0.92,
      negativeProb: 0.04,
      neutralProb: 0.04,
      modelVersion: BERT_MODEL_VERSION,
    },
    ...overrides,
  }
}

describe('ReviewCard', () => {
  it('renders the author name and rating', () => {
    render(<ReviewCard review={makeReview()} />)
    expect(screen.getByText('Casey')).toBeInTheDocument()
    expect(screen.getByText('9.4/10')).toBeInTheDocument()
  })

  it('omits the rating when not provided', () => {
    const { rating: _rating, ...rest } = makeReview()
    render(<ReviewCard review={rest as ReviewWithSentimentDTO} />)
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument()
  })

  it('shows the sentiment label and confidence percentage in the pill', () => {
    render(<ReviewCard review={makeReview()} />)
    expect(screen.getByText(/POSITIVE · 92%/)).toBeInTheDocument()
  })

  it('renders the review text', () => {
    render(<ReviewCard review={makeReview()} />)
    // Text is split into segments via highlighting; assert key tokens render.
    expect(screen.getByText('amazing')).toBeInTheDocument()
    expect(screen.getByText('brilliant')).toBeInTheDocument()
  })

  it('highlights positive lexicon words with <mark>', () => {
    const { container } = render(<ReviewCard review={makeReview()} />)
    const marks = container.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThan(0)
    const markedText = Array.from(marks).map((m) => m.textContent)
    expect(markedText).toContain('amazing')
    expect(markedText).toContain('brilliant')
  })

  it('does not render the sentiment pill when analysis is null', () => {
    render(<ReviewCard review={makeReview({ analysis: null })} />)
    expect(screen.queryByText(/POSITIVE/)).not.toBeInTheDocument()
    expect(screen.queryByText(/NEGATIVE/)).not.toBeInTheDocument()
    expect(screen.queryByText(/NEUTRAL/)).not.toBeInTheDocument()
  })

  it('renders a NEGATIVE pill for negative reviews', () => {
    const negative = makeReview({
      author: 'Jamie',
      text: 'A boring and disappointing waste of time.',
      analysis: {
        id: 's2',
        reviewId: 'r1',
        label: SentimentLabel.negative,
        confidenceScore: 0.81,
        positiveProb: 0.09,
        negativeProb: 0.81,
        neutralProb: 0.1,
        modelVersion: BERT_MODEL_VERSION,
      },
    })
    render(<ReviewCard review={negative} />)
    expect(screen.getByText(/NEGATIVE · 81%/)).toBeInTheDocument()
  })
})
