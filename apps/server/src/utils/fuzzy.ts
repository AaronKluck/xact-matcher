const visualSimilarity: Record<string, Record<string, number>> = {
  '0': { 'O': 0.8, 'Q': 0.6 },
  '1': { 'I': 0.8, 'L': 0.6 },
  '2': { 'Z': 0.6 },
  '5': { 'S': 0.7 },
  '6': { 'G': 0.7 },
  '8': { 'B': 0.8 },
  '9': { 'G': 0.5 },
  'B': { '8': 0.8 },
  'G': { '6': 0.7, '9': 0.5 },
  'O': { '0': 0.8 },
  'I': { '1': 0.8, 'L': 0.6 },
  'S': { '5': 0.7, '$': 0.5 },
  '$': { 'S': 0.5 },
  '@': { 'A': 0.6 },
  'A': { '@': 0.6, '4': 0.6 },
  'T': { '7': 0.6 },
};

function visualCharSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.toUpperCase() === b.toUpperCase()) return 0.9;

  const upperA = a.toUpperCase();
  const upperB = b.toUpperCase();
  return (
    visualSimilarity[upperA]?.[upperB] ??
    visualSimilarity[upperB]?.[upperA] ??
    0
  );
}

/**
 * Implements a visual-match-aware Levenshtein distance algorithm. The fuzzy
 * matching libraries I could find only accounted for placement and case.
 * For transparency: I had an AI help me write this.
 */
export function fuzzyVisualScore(base: string, input: string): number {
  const m = base.length;
  const n = input.length;
  if (m === 0 && n === 0) return 1;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    const a = base[i - 1];
    for (let j = 1; j <= n; j++) {
      const b = input[j - 1];
      const similarity = visualCharSimilarity(a, b);
      const substCost = 1 - similarity;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + substCost // substitution
      );
    }
  }

  const rawCost = dp[m][n];
  const maxLen = Math.max(m, n);
  return Math.max(0, Math.min(1, 1 - rawCost / maxLen));
}