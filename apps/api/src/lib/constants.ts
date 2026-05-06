export const PORT = Number(process.env['PORT'] ?? 3001)
export const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173'
export const DATABASE_URL = process.env['DATABASE_URL'] ?? ''

// FastAPI sentiment sidecar (services/sentiment). Default port matches the
// service's default. The 8001 fallback is what we used during Phase 3 dev
// because something else was holding 8000 — the canonical default is 8000.
export const SENTIMENT_SERVICE_URL =
  process.env['SENTIMENT_SERVICE_URL'] ?? 'http://127.0.0.1:8000'

// Threshold mapping from the binary IMDB model to the existing 3-class UI.
// `p_positive >= POSITIVE_THRESHOLD` → positive
// `p_positive <= NEGATIVE_THRESHOLD` → negative
// otherwise → neutral
export const POSITIVE_THRESHOLD = 0.65
export const NEGATIVE_THRESHOLD = 0.35

// Hard cap on a single batch request to the sidecar. Matches MAX_BATCH_SIZE
// in services/sentiment/main.py — keep them in sync.
export const SENTIMENT_BATCH_MAX = 64

// In-memory cache cap: ~5k entries × ~200 bytes = ~1 MB.
export const SENTIMENT_CACHE_MAX = 5000

// Word lists live in @movie-sentiment/shared so the frontend can use them too
export {
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
  NEGATION_WORDS,
  NEGATION_WINDOW,
} from '@movie-sentiment/shared'
