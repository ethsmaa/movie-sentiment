import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfidenceGauge } from './ConfidenceGauge'

describe('ConfidenceGauge', () => {
  it('renders the rounded percentage inside the SVG ring', () => {
    render(<ConfidenceGauge confidence={0.873} />)
    expect(screen.getByText('87')).toBeInTheDocument()
  })

  it('shows HIGH label when confidence >= 0.8', () => {
    render(<ConfidenceGauge confidence={0.85} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('shows MODERATE label between 0.65 and 0.8', () => {
    render(<ConfidenceGauge confidence={0.7} />)
    expect(screen.getByText('MODERATE')).toBeInTheDocument()
  })

  it('shows LOW label below 0.65', () => {
    render(<ConfidenceGauge confidence={0.5} />)
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })

  it('renders the BERT base sub-caption with the same percentage', () => {
    render(<ConfidenceGauge confidence={0.92} />)
    expect(screen.getByText(/BERT base · 92% mean/)).toBeInTheDocument()
  })

  it('treats the boundary 0.8 as HIGH', () => {
    render(<ConfidenceGauge confidence={0.8} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
  })

  it('treats the boundary 0.65 as MODERATE', () => {
    render(<ConfidenceGauge confidence={0.65} />)
    expect(screen.getByText('MODERATE')).toBeInTheDocument()
  })
})
