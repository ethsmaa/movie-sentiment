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

export const TAPE_COLORS = [
  '#9b2614',
  '#e8a23a',
  '#2b8a8e',
  '#3d6b3a',
  '#6b3a8a',
] as const

export function tapeColor(idx: number): string {
  return TAPE_COLORS[idx % TAPE_COLORS.length] ?? TAPE_COLORS[0]
}

export function hypePercentage(hypeScore: number): number {
  return Math.round(((hypeScore + 1) / 2) * 100)
}

export function hypeLabel(percentage: number): string {
  if (percentage >= 80) return 'OVERWHELMINGLY POSITIVE'
  if (percentage >= 65) return 'MOSTLY POSITIVE'
  if (percentage >= 50) return 'SLIGHTLY POSITIVE'
  if (percentage >= 35) return 'MIXED SIGNALS'
  if (percentage >= 20) return 'MOSTLY NEGATIVE'
  return 'OVERWHELMINGLY NEGATIVE'
}
