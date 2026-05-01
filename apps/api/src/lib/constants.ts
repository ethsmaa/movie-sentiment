export const PORT = Number(process.env['PORT'] ?? 3001)
export const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:5173'
export const DATABASE_URL = process.env['DATABASE_URL'] ?? ''

export const POSITIVE_WORDS = [
  'amazing', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'outstanding',
  'superb', 'magnificent', 'great', 'good', 'love', 'loved', 'beautiful',
  'perfect', 'best', 'incredible', 'awesome', 'enjoyable', 'masterpiece',
  'compelling', 'stunning', 'thrilling', 'delightful', 'heartwarming', 'moving',
  'powerful', 'captivating', 'engaging', 'impressive', 'entertaining', 'fun',
  'enjoyable', 'remarkable', 'exceptional', 'splendid', 'terrific', 'recommend',
  'favorite', 'gem', 'classic', 'touching', 'inspiring', 'genius', 'epic',
  'unforgettable', 'emotional', 'riveting', 'solid', 'refreshing', 'clever',
  'witty', 'charming', 'believable', 'realistic', 'deep', 'thought-provoking',
  'well-written', 'well-acted', 'well-directed', 'well-crafted', 'must-see',
  'watch', 'enjoy', 'liked', 'pleased', 'satisfied', 'excited', 'happy',
  'joy', 'pleasure', 'delight', 'appreciate', 'admire', 'respect', 'honor',
  'treasure', 'cherish', 'adore', 'brilliant', 'superb', 'flawless',
  'breathtaking', 'extraordinary', 'phenomenal', 'marvelous', 'splendid',
]

export const NEGATIVE_WORDS = [
  'terrible', 'awful', 'horrible', 'dreadful', 'disgusting', 'pathetic',
  'waste', 'boring', 'dull', 'bad', 'worst', 'poor', 'mediocre', 'disappointing',
  'disappointed', 'hated', 'hate', 'dislike', 'stupid', 'ridiculous', 'absurd',
  'cliché', 'predictable', 'overrated', 'pretentious', 'shallow', 'empty',
  'hollow', 'contrived', 'forced', 'unconvincing', 'unrealistic', 'forgettable',
  'tedious', 'painful', 'unbearable', 'insufferable', 'annoying', 'frustrating',
  'confusing', 'incoherent', 'plotless', 'senseless', 'pointless', 'meaningless',
  'amateurish', 'weak', 'flat', 'stale', 'derivative', 'generic', 'formulaic',
  'cheesy', 'corny', 'cringe', 'offensive', 'disturbing', 'inappropriate',
  'overwrought', 'melodramatic', 'manipulative', 'exploit', 'regret', 'skip',
  'avoid', 'mess', 'disaster', 'failure', 'flop', 'rubbish', 'trash',
  'garbage', 'junk', 'useless', 'worthless', 'failed', 'below', 'lacks',
  'missing', 'slow', 'draggy', 'endless', 'overlong', 'padded', 'rushed',
]

export const NEGATION_WORDS = [
  'not', 'no', 'never', 'neither', 'nor', 'without',
  "don't", "doesn't", "didn't", "won't", "wouldn't",
  "couldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't",
]

export const NEGATION_WINDOW = 2
