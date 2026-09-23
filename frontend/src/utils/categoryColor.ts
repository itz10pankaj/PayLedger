const SERIES_COUNT = 8;

// Color follows the category's fixed position in the categories list,
// never reassigned when a filter/list changes. Categories past the 8
// validated slots fall back to muted ink rather than generating an
// unvalidated 9th hue. Shared by the expenses chart and transaction avatars.
export function colorForCategory(category: string, categories: string[]): string {
  const index = categories.indexOf(category);
  if (index < 0 || index >= SERIES_COUNT) return 'var(--color-text-subtle)';
  return `var(--series-${index + 1})`;
}
