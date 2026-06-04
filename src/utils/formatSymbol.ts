/**
 * Centralized formatter for token symbols.
 * Returns the display string with a leading '$'.
 * Guarantees exactly one leading '$' even if the input already includes one.
 */
export function formatDisplaySymbol(symbol: string): string {
  const clean = symbol.startsWith('$') ? symbol.slice(1) : symbol;
  return `$${clean}`;
}
