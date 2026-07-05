import { getRepoTree } from "../services/tree";
import { renderStatic, withLoading } from "../ui/render";
import { LocView } from "../ui/views/loc-view";

type LocByLanguage = {
  language: string;
  lines: number;
};

type LocByDirectory = {
  directory: string;
  lines: number;
};

export type LocJsonResult = {
  repository: string;
  approx: true;
  truncated: boolean;
  total_lines: number;
  by_language: LocByLanguage[];
  by_directory: LocByDirectory[];
  method: "size-based-estimate";
};

const IGNORED_SEGMENTS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".git"
]);

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  py: "Python",
  rb: "Ruby",
  php: "PHP",
  java: "Java",
  kt: "Kotlin",
  rs: "Rust",
  go: "Go",
  c: "C",
  h: "C",
  cc: "C++",
  cpp: "C++",
  cxx: "C++",
  hpp: "C++",
  cs: "C#",
  swift: "Swift",
  scala: "Scala",
  r: "R",
  sh: "Shell",
  bash: "Shell",
  zsh: "Shell",
  ps1: "PowerShell",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  vue: "Vue",
  svelte: "Svelte",
  json: "JSON",
  yml: "YAML",
  yaml: "YAML",
  toml: "TOML",
  md: "Markdown",
  mdx: "Markdown",
  txt: "Text"
};

const AVG_BYTES_PER_LINE: Record<string, number> = {
  TypeScript: 33,
  JavaScript: 34,
  Python: 28,
  Ruby: 30,
  PHP: 32,
  Java: 36,
  Kotlin: 36,
  Rust: 34,
  Go: 31,
  C: 30,
  "C++": 33,
  "C#": 35,
  Swift: 35,
  Scala: 37,
  R: 29,
  Shell: 27,
  PowerShell: 32,
  SQL: 36,
  HTML: 40,
  CSS: 34,
  SCSS: 36,
  Less: 35,
  Vue: 38,
  Svelte: 36,
  JSON: 48,
  YAML: 42,
  TOML: 32,
  Markdown: 52,
  Text: 62,
  Other: 38
};

function shouldIgnore(path: string): boolean {
  const segments = path.split("/");
  return segments.some((segment) => IGNORED_SEGMENTS.has(segment));
}

function getLanguageFromPath(path: string): string {
  const fileName = path.split("/").pop() ?? path;
  if (fileName.endsWith(".min.js") || fileName.endsWith(".min.css")) {
    return "Other";
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop() ?? "" : "";
  if (!ext) {
    return "Other";
  }
  return EXTENSION_TO_LANGUAGE[ext.toLowerCase()] ?? "Other";
}

function estimateLines(language: string, sizeBytes: number): number {
  const divisor = AVG_BYTES_PER_LINE[language] ?? AVG_BYTES_PER_LINE.Other;
  return Math.max(1, Math.round(sizeBytes / divisor));
}

function toSortedEntries(record: Record<string, number>, limit: number) {
  return Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

export async function getLocPayload(
  owner: string,
  repo: string
): Promise<LocJsonResult> {
  const { tree, truncated } = await getRepoTree(owner, repo);
  const byLanguage: Record<string, number> = {};
  const byDirectory: Record<string, number> = {};
  let totalLines = 0;

  for (const item of tree) {
    if (item.type !== "blob") {
      continue;
    }
    const path = item.path;
    if (shouldIgnore(path)) {
      continue;
    }
    const sizeBytes = item.size ?? 0;
    if (sizeBytes === 0) {
      continue;
    }
    const language = getLanguageFromPath(path);
    const lines = estimateLines(language, sizeBytes);
    totalLines += lines;
    byLanguage[language] = (byLanguage[language] ?? 0) + lines;

    const topDir = path.includes("/") ? path.split("/")[0]! : "root";
    byDirectory[topDir] = (byDirectory[topDir] ?? 0) + lines;
  }

  const topLanguages = toSortedEntries(byLanguage, 10).map(({ key, value }) => ({
    language: key,
    lines: value
  }));
  const topDirectories = toSortedEntries(byDirectory, 10).map(
    ({ key, value }) => ({
      directory: key,
      lines: value
    })
  );

  return {
    repository: `${owner}/${repo}`,
    approx: true,
    truncated,
    total_lines: totalLines,
    by_language: topLanguages,
    by_directory: topDirectories,
    method: "size-based-estimate"
  };
}

export function printLocResult(payload: LocJsonResult): void {
  renderStatic(<LocView payload={payload} />);
}

export async function runLocCommand(owner: string, repo: string): Promise<void> {
  const payload = await withLoading(`Analyzing ${owner}/${repo}…`, () =>
    getLocPayload(owner, repo)
  );
  printLocResult(payload);
}
