export const ELLIPSIS = "…";

export function truncate(str: string, maxLen: number): string {
  if (maxLen <= 0) {
    return "";
  }
  if (str.length <= maxLen) {
    return str;
  }
  if (maxLen <= ELLIPSIS.length) {
    return ELLIPSIS.slice(0, maxLen);
  }
  return str.slice(0, maxLen - ELLIPSIS.length) + ELLIPSIS;
}

export function getTerminalWidth(margin = 2): number {
  return (process.stdout.columns ?? 80) - margin;
}

export function getTableRowWidth(colWidths: number[]): number {
  return colWidths.reduce((a, b) => a + b, 0) + colWidths.length * 3 + 1;
}
