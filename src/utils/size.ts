export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const gb = mb / 1024;
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

export function formatSizeFromKb(sizeKb: number): string {
  const sizeMb = sizeKb / 1024;
  if (sizeMb < 1024) {
    return `${sizeMb.toFixed(2)} MB`;
  }

  const sizeGb = sizeMb / 1024;
  return `${sizeGb.toFixed(2)} GB`;
}

export function kbToMbRounded(sizeKb: number): number {
  return Number((sizeKb / 1024).toFixed(2));
}

export function formatStars(value: number): string {
  if (value >= 1000) {
    return `${Math.round((value / 1000) * 10) / 10}k`;
  }
  return String(value);
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return String(value);
}
