/**
 * Formats a number as Argentine pesos string.
 * Examples: 2400 -> "$2.400", -6700 -> "$-6.700" or "-$6.700", 0 -> "$0"
 */
export function formatPesos(amount: number, showSignForNegative = true): string {
  if (amount === 0) return '$0';
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(absVal);

  if (isNegative && showSignForNegative) {
    return `$-${formatted}`;
  }
  return `$${formatted}`;
}

export function formatNumberOnly(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parses user input into a valid number, handling Argentine dots, commas, negative signs
 */
export function parsePesosInput(str: string): number {
  if (!str) return 0;
  const clean = str
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.round(val);
}
