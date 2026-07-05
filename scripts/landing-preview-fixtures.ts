import type { AnalyzeJsonResult } from "../src/commands/analyze";
import type { LocJsonResult } from "../src/commands/loc";
import type { RepoRow } from "../src/ui/views/repo-view";

export const previewColumns = {
  hero: 46,
  card: 40,
  table: 52,
  wide: 56
} as const;

export const heroRepo = {
  repository: "torvalds/linux",
  sizeKb: Math.round(6.02 * 1024 * 1024),
  stars: 230_800,
  language: "C"
} as const;

export const singleRepo = {
  repository: "vercel/next.js",
  sizeKb: Math.round(2.43 * 1024 * 1024),
  stars: 139_000,
  language: "JavaScript"
} as const;

export const currentRepo = {
  repository: "hanif-adedotun/reposizer",
  sizeKb: Math.round(0.42 * 1024),
  stars: 48,
  language: "TypeScript"
} as const;

export const compareRows: RepoRow[] = [
  {
    repository: "vercel/next.js",
    size_mb: 2491.76,
    stars: 139_160,
    language: "JavaScript"
  },
  {
    repository: "facebook/react",
    size_mb: 1146.88,
    stars: 240_000,
    language: "JavaScript"
  }
];

export const analyzePayload: AnalyzeJsonResult = {
  repository: "vercel/next.js",
  truncated: false,
  total_bytes: 2_609_000_000,
  top_directories: [
    { directory: "packages", bytes: 1_820_000_000 },
    { directory: "examples", bytes: 420_000_000 },
    { directory: "test", bytes: 180_000_000 }
  ]
};

export const locPayload: LocJsonResult = {
  repository: "vercel/next.js",
  approx: true,
  truncated: false,
  total_lines: 1_200_000,
  top_files: [
    {
      path: "packages/next/src/server/render.tsx",
      lines: 42_180,
      language: "TypeScript"
    },
    {
      path: "packages/react-dom/src/client/ReactDOMRoot.js",
      lines: 18_420,
      language: "JavaScript"
    }
  ],
  method: "size-based-estimate"
};
