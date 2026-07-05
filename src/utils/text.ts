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

export function withTerminalWidth<T>(columns: number, fn: () => T): T {
  const stdout = process.stdout as NodeJS.WriteStream & { columns?: number };
  const original = stdout.columns;
  stdout.columns = columns + 2;

  try {
    return fn();
  } finally {
    if (original === undefined) {
      delete stdout.columns;
    } else {
      stdout.columns = original;
    }
  }
}

export function getTableRowWidth(colWidths: number[]): number {
  return colWidths.reduce((a, b) => a + b, 0) + colWidths.length * 3 + 1;
}
