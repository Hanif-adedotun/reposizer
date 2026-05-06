import { getRepoTree } from "../services/tree";
import { formatBytes } from "../utils/size";

export type AnalyzeJsonResult = {
  repository: string;
  truncated: boolean;
  total_bytes: number;
  top_directories: Array<{ directory: string; bytes: number }>;
};

function aggregateTopDirectories(
  tree: Array<{ path: string; type: string; size?: number }>,
  limit: number
): { totalBytes: number; dirs: Array<{ directory: string; bytes: number }> } {
  const dirSizes: Record<string, number> = {};
  let totalBytes = 0;

  for (const item of tree) {
    if (item.type !== "blob") {
      continue;
    }
    const size = item.size ?? 0;
    const path = item.path;
    totalBytes += size;

    const topDir = path.includes("/") ? path.split("/")[0]! : "root";
    dirSizes[topDir] = (dirSizes[topDir] ?? 0) + size;
  }

  const dirs = Object.entries(dirSizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([directory, bytes]) => ({ directory, bytes }));

  return { totalBytes, dirs };
}

export async function getAnalyzePayload(
  owner: string,
  repo: string
): Promise<AnalyzeJsonResult> {
  const { tree, truncated } = await getRepoTree(owner, repo);
  const { totalBytes, dirs } = aggregateTopDirectories(tree, 10);
  return {
    repository: `${owner}/${repo}`,
    truncated,
    total_bytes: totalBytes,
    top_directories: dirs
  };
}

export function printAnalyzeResult(payload: AnalyzeJsonResult): void {
  if (payload.truncated) {
    console.error(
      "Warning: Git tree response was truncated by GitHub; directory totals may be incomplete."
    );
  }

  console.log(`Repository: ${payload.repository}`);
  console.log(`Total (approx): ${formatBytes(payload.total_bytes)}`);
  console.log("");
  console.log("Top directories:");
  console.log("----------------");

  for (const { directory, bytes } of payload.top_directories) {
    console.log(`${directory.padEnd(15)} ${formatBytes(bytes)}`);
  }
}

export async function runAnalyzeCommand(owner: string, repo: string): Promise<void> {
  const payload = await getAnalyzePayload(owner, repo);
  printAnalyzeResult(payload);
}
