// Common stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'can', 'should', 'now', 'also',
  'into', 'our', 'out', 'your', 'their', 'them', 'then', 'there', 'these',
  'those', 'through', 'would', 'could', 'about', 'been', 'being', 'before',
  'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once',
  'here', 'why', 'how', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'over',
  'like', 'know', 'think', 'going', 'want', 'see', 'look', 'make', 'way',
  'really', 'well', 'back', 'even', 'good', 'new', 'first', 'last', 'long',
  'great', 'little', 'own', 'old', 'right', 'big', 'high', 'different', 'small',
  'large', 'next', 'early', 'young', 'important', 'public', 'bad', 'sure',
  'yeah', 'yes', 'okay', 'oh', 'uh', 'um', 'gonna', 'got', 'get', 'getting',
  'thing', 'things', 'something', 'anything', 'everything', 'nothing', 'say',
  'said', 'saying', 'says', 'let', 'lets', 'come', 'came', 'coming', 'one',
  'two', 'three', 'four', 'five', 'people', 'time', 'year', 'years', 'day',
  'days', 'went', 'done', 'does', 'doing', 'did', 'made', 'take', 'much',
  'many'
]);

// Startup/business related terms to boost
const STARTUP_TERMS = new Set([
  'startup', 'startups', 'founder', 'founders', 'funding', 'investor', 'investors',
  'venture', 'capital', 'seed', 'series', 'valuation', 'equity', 'revenue',
  'growth', 'scale', 'scaling', 'product', 'market', 'fit', 'mvp', 'pivot',
  'acquisition', 'exit', 'ipo', 'bootstrap', 'bootstrapped', 'burn', 'rate',
  'runway', 'traction', 'metrics', 'kpi', 'saas', 'b2b', 'b2c', 'arr', 'mrr',
  'churn', 'retention', 'cac', 'ltv', 'fundraising', 'pitch', 'deck', 'term',
  'sheet', 'cap', 'table', 'dilution', 'vesting', 'cliff', 'accelerator',
  'incubator', 'yc', 'ycombinator', 'techstars', 'angel', 'pre-seed',
  'unicorn', 'decacorn', 'hiring', 'team', 'culture', 'remote', 'hybrid',
  'ai', 'ml', 'machine', 'learning', 'artificial', 'intelligence', 'gpt',
  'llm', 'api', 'platform', 'marketplace', 'network', 'effects', 'moat',
  'competition', 'disruption', 'innovation', 'technology', 'tech', 'software',
  'hardware', 'fintech', 'healthtech', 'edtech', 'proptech', 'insurtech',
  'crypto', 'blockchain', 'web3', 'defi', 'nft'
]);

/**
 * Extract themes/keywords from transcript content
 * @param {string} content - Full transcript text
 * @param {number} topN - Number of top themes to return
 * @returns {Object} Map of theme to frequency
 */
export function extractThemes(content, topN = 30) {
  // Tokenize and clean
  const words = content
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  // Count frequencies
  const frequencies = {};
  for (const word of words) {
    frequencies[word] = (frequencies[word] || 0) + 1;
  }

  // Boost startup-related terms
  for (const term of STARTUP_TERMS) {
    if (frequencies[term]) {
      frequencies[term] *= 2;
    }
  }

  // Extract bigrams (two-word phrases)
  const bigrams = {};
  for (let i = 0; i < words.length - 1; i++) {
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }
  }

  // Combine and filter
  const combined = { ...frequencies };
  for (const [bigram, count] of Object.entries(bigrams)) {
    if (count >= 3) {
      // Only include bigrams that appear 3+ times
      combined[bigram] = count * 3; // Boost bigrams
    }
  }

  // Sort by frequency and return top N
  const sorted = Object.entries(combined)
    .filter(([_, count]) => count >= 3) // Minimum frequency threshold
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return Object.fromEntries(sorted);
}

/**
 * Find common themes across multiple transcripts
 */
export function findCommonThemes(transcripts, topN = 20) {
  const allThemes = {};

  for (const transcript of transcripts) {
    const themes = extractThemes(transcript.content, 50);
    for (const [theme, freq] of Object.entries(themes)) {
      allThemes[theme] = (allThemes[theme] || 0) + freq;
    }
  }

  return Object.entries(allThemes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([theme, frequency]) => ({ theme, frequency }));
}
