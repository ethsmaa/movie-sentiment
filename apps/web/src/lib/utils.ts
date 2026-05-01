import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatHypeScore(score: number): string {
  return `${score >= 0 ? '+' : ''}${(score * 100).toFixed(0)}%`
}

export function hypeScoreToLabel(score: number): string {
  if (score >= 0.6) return 'Overwhelmingly Positive'
  if (score >= 0.3) return 'Mostly Positive'
  if (score >= 0.05) return 'Slightly Positive'
  if (score > -0.05) return 'Mixed'
  if (score > -0.3) return 'Slightly Negative'
  if (score > -0.6) return 'Mostly Negative'
  return 'Overwhelmingly Negative'
}

export function hypeScoreToColor(score: number): string {
  if (score >= 0.3) return '#3ECF8E'
  if (score >= 0.05) return '#A3E635'
  if (score > -0.05) return '#F5B14B'
  if (score > -0.3) return '#FB923C'
  return '#E5484D'
}
