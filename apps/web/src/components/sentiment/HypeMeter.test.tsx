import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HypeMeter } from './HypeMeter'

describe('HypeMeter', () => {
  it('renders the percentage derived from the hype score', () => {
    render(<HypeMeter hypeScore={0} />)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
  })

  it('renders 100 when hype score is 1', () => {
    render(<HypeMeter hypeScore={1} />)
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders 0 when hype score is -1', () => {
    render(<HypeMeter hypeScore={-1} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows the matching hype label', () => {
    render(<HypeMeter hypeScore={0.8} />)
    expect(screen.getByText('OVERWHELMINGLY POSITIVE')).toBeInTheDocument()
  })

  it('shows the negative label for low scores', () => {
    render(<HypeMeter hypeScore={-0.7} />)
    expect(screen.getByText('OVERWHELMINGLY NEGATIVE')).toBeInTheDocument()
  })

  it('displays the static "Audience Hype" caption', () => {
    render(<HypeMeter hypeScore={0.2} />)
    expect(screen.getByText('Audience Hype')).toBeInTheDocument()
  })
})
