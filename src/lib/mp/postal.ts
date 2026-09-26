/** Uppercases and strips spaces; returns null unless the result looks like A1A1A1. */
export function normalizePostal(input: string): string | null {
  const code = input.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(code) ? code : null;
}

/** "K1P1A4" -> "K1P 1A4" */
export function formatPostal(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
