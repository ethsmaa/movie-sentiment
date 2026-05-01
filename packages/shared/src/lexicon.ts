export const POSITIVE_WORDS = [
  'amazing', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'outstanding',
  'superb', 'magnificent', 'great', 'good', 'love', 'loved', 'beautiful',
  'perfect', 'best', 'incredible', 'awesome', 'enjoyable', 'masterpiece',
  'compelling', 'stunning', 'thrilling', 'delightful', 'heartwarming', 'moving',
  'powerful', 'captivating', 'engaging', 'impressive', 'entertaining', 'fun',
  'remarkable', 'exceptional', 'splendid', 'terrific', 'recommend',
  'favorite', 'gem', 'classic', 'touching', 'inspiring', 'genius', 'epic',
  'unforgettable', 'emotional', 'riveting', 'solid', 'refreshing', 'clever',
  'witty', 'charming', 'believable', 'realistic', 'deep', 'thought-provoking',
  'well-written', 'well-acted', 'well-directed', 'well-crafted', 'must-see',
  'watch', 'enjoy', 'liked', 'pleased', 'satisfied', 'excited', 'happy',
  'joy', 'pleasure', 'delight', 'appreciate', 'admire', 'respect', 'honor',
  'treasure', 'cherish', 'adore', 'flawless',
  'breathtaking', 'extraordinary', 'phenomenal', 'marvelous',
] as const

export const NEGATIVE_WORDS = [
  'terrible', 'awful', 'horrible', 'dreadful', 'disgusting', 'pathetic',
  'waste', 'boring', 'dull', 'bad', 'worst', 'poor', 'mediocre', 'disappointing',
  'disappointed', 'hated', 'hate', 'dislike', 'stupid', 'ridiculous', 'absurd',
  'predictable', 'overrated', 'pretentious', 'shallow', 'empty',
  'hollow', 'contrived', 'forced', 'unconvincing', 'unrealistic', 'forgettable',
  'tedious', 'painful', 'unbearable', 'insufferable', 'annoying', 'frustrating',
  'confusing', 'incoherent', 'plotless', 'senseless', 'pointless', 'meaningless',
  'amateurish', 'weak', 'flat', 'stale', 'derivative', 'generic', 'formulaic',
  'cheesy', 'corny', 'cringe', 'offensive', 'disturbing', 'inappropriate',
  'overwrought', 'melodramatic', 'manipulative', 'regret', 'skip',
  'avoid', 'mess', 'disaster', 'failure', 'flop', 'rubbish', 'trash',
  'garbage', 'junk', 'useless', 'worthless', 'failed', 'lacks',
  'missing', 'slow', 'draggy', 'endless', 'overlong', 'padded', 'rushed',
  'clunky', 'cliché',
] as const

export const NEGATION_WORDS = [
  'not', 'no', 'never', 'neither', 'nor', 'without',
  "don't", "doesn't", "didn't", "won't", "wouldn't",
  "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't",
] as const

export const NEGATION_WINDOW = 2

export type PositiveWord = (typeof POSITIVE_WORDS)[number]
export type NegativeWord = (typeof NEGATIVE_WORDS)[number]

export interface TextSegment {
  text: string
  highlight: 'positive' | 'negative' | null
}

const POSITIVE_SET = new Set<string>(POSITIVE_WORDS)
const NEGATIVE_SET = new Set<string>(NEGATIVE_WORDS)

export function getTextSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  // Split on word boundaries while keeping delimiters (spaces, punctuation)
  const parts = text.split(/(\b[a-zA-Z'-]+\b)/)

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (POSITIVE_SET.has(lower)) {
      segments.push({ text: part, highlight: 'positive' })
    } else if (NEGATIVE_SET.has(lower)) {
      segments.push({ text: part, highlight: 'negative' })
    } else {
      segments.push({ text: part, highlight: null })
    }
  }

  return segments
}
