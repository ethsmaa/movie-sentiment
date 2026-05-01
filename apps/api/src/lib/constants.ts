export const PORT = Number(process.env['PORT'] ?? 3001)
export const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173'
export const DATABASE_URL = process.env['DATABASE_URL'] ?? ''

// Word lists live in @movie-sentiment/shared so the frontend can use them too
export {
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
  NEGATION_WORDS,
  NEGATION_WINDOW,
} from '@movie-sentiment/shared'
