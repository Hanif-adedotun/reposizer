import {
  fetchOrganizationRepositories,
  fetchRepositoryMetadata
} from "../services/github";
import {
  getAnalyzePayload,
  printAnalyzeResult,
  runAnalyzeCommand
} from "./analyze";
import { getLocPayload, printLocResult, runLocCommand } from "./loc";
import { detectCurrentRepositoryFromGitRemote } from "../utils/git";
import {
  formatCompactCount,
  formatSizeFromKb,
  formatStars,
  kbToMbRounded
} from "../utils/size";

export type MultiRepoSort = "size" | "stars" | "name";

function parseRepository(
  input: string,
  position: number
): { owner: string; repo: string } {
  const trimmed = input.trim();
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid repository at position ${position}: "${input}". Use owner/repo.`
    );
  }
  return { owner: match[1], repo: match[2] };
}

type ParsedRepoArg = {
  input: string;
  owner: string;
  repo: string;
};

function dedupeParsedArgs(items: ParsedRepoArg[]): ParsedRepoArg[] {
  const seen = new Set<string>();
  const out: ParsedRepoArg[] = [];
  for (const item of items) {
    const key = `${item.owner.toLowerCase()}/${item.repo.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(item);
  }
  return out;
}

function parseRepositoryArgs(inputs: string[]): ParsedRepoArg[] {
  const parsed: ParsedRepoArg[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    const { owner, repo } = parseRepository(input, i + 1);
    parsed.push({ input, owner, repo });
  }
  return dedupeParsedArgs(parsed);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index]!, index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

const REPO_METADATA_CONCURRENCY = 4;
const ANALYZE_FETCH_CONCURRENCY = 2;
const LOC_FETCH_CONCURRENCY = 2;

function sortRepoRows(
  rows: RepoOutputPayload[],
  sort: MultiRepoSort
): RepoOutputPayload[] {
  const copy = [...rows];
  if (sort === "size") {
    copy.sort(
      (a, b) =>
        b.size_mb - a.size_mb || a.repository.localeCompare(b.repository)
    );
  } else if (sort === "stars") {
    copy.sort(
      (a, b) => b.stars - a.stars || a.repository.localeCompare(b.repository)
    );
  } else {
    copy.sort((a, b) => a.repository.localeCompare(b.repository));
  }
  return copy;
}

export async function runRepoCommand(
  repositoryInput: string,
  jsonOutput: boolean
): Promise<void> {
  const { owner, repo } = parseRepository(repositoryInput, 1);
  const metadata = await fetchRepositoryMetadata(owner, repo);

  if (jsonOutput) {
    const payload = {
      repository: metadata.fullName,
      size_mb: kbToMbRounded(metadata.sizeKb),
      stars: metadata.stargazersCount,
      language: metadata.language ?? "Unknown"
    };
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Repository: ${metadata.fullName}`);
  console.log(`Size: ${formatSizeFromKb(metadata.sizeKb)}`);
  const loc = await getLocPayload(owner, repo);
  console.log(`Lines: ${formatCompactCount(loc.total_lines)}`);
  console.log(`Stars: ${formatStars(metadata.stargazersCount)}`);
  console.log(`Language: ${metadata.language ?? "Unknown"}`);
}

type RepoOutputPayload = {
  repository: string;
  size_mb: number;
  stars: number;
  language: string;
};

function truncate(value: string, maxWidth: number): string {
  if (value.length <= maxWidth) {
    return value;
  }
  if (maxWidth <= 1) {
    return value.slice(0, maxWidth);
  }
  return `${value.slice(0, maxWidth - 1)}…`;
}

function renderOrgTable(
  rows: Array<{
    repository: string;
    size_mb: number;
    stars: number;
    language: string;
  }>
): string {
  const headers = ["Repository", "Size", "Stars", "Language"] as const;
  const repositoryWidth = Math.min(
    48,
    Math.max(
      headers[0].length,
      ...rows.map((row) => truncate(row.repository, 48).length)
    )
  );
  const sizeWidth = Math.max(
    headers[1].length,
    ...rows.map((row) => formatSizeFromKb(row.size_mb * 1024).length)
  );
  const starsWidth = Math.max(
    headers[2].length,
    ...rows.map((row) => formatStars(row.stars).length)
  );
  const languageWidth = Math.max(
    headers[3].length,
    ...rows.map((row) => row.language.length)
  );

  const border = `+-${"-".repeat(repositoryWidth)}-+-${"-".repeat(sizeWidth)}-+-${"-".repeat(starsWidth)}-+-${"-".repeat(languageWidth)}-+`;

  const headerRow = `| ${headers[0].padEnd(repositoryWidth)} | ${headers[1].padEnd(sizeWidth)} | ${headers[2].padEnd(starsWidth)} | ${headers[3].padEnd(languageWidth)} |`;

  const bodyRows = rows.map((row) => {
    const repository = truncate(row.repository, repositoryWidth).padEnd(
      repositoryWidth
    );
    const size = formatSizeFromKb(row.size_mb * 1024).padEnd(sizeWidth);
    const stars = formatStars(row.stars).padEnd(starsWidth);
    const language = row.language.padEnd(languageWidth);
    return `| ${repository} | ${size} | ${stars} | ${language} |`;
  });

  return [border, headerRow, border, ...bodyRows, border].join("\n");
}

function buildPayload(repositoryInput: string, metadata: Awaited<ReturnType<typeof fetchRepositoryMetadata>>): RepoOutputPayload {
  return {
    repository: metadata.fullName || repositoryInput,
    size_mb: kbToMbRounded(metadata.sizeKb),
    stars: metadata.stargazersCount,
    language: metadata.language ?? "Unknown"
  };
}

export async function runRepositoriesCommand(
  repositoryInputs: string[],
  jsonOutput: boolean,
  analyze = false,
  loc = false,
  sort: MultiRepoSort = "size"
): Promise<void> {
  if (analyze && loc) {
    throw new Error('Use either "--analyze" or "--loc", not both together.');
  }
  const effectiveInputs =
    repositoryInputs.length > 0
      ? repositoryInputs
      : [detectCurrentRepositoryFromGitRemote()];

  const parsedArgs = parseRepositoryArgs(effectiveInputs);

  if (analyze) {
    if (jsonOutput) {
      const payloads = await mapWithConcurrency(
        parsedArgs,
        ANALYZE_FETCH_CONCURRENCY,
        async (item) => getAnalyzePayload(item.owner, item.repo)
      );
      console.log(
        JSON.stringify(payloads.length === 1 ? payloads[0] : payloads, null, 2)
      );
      return;
    }

    if (parsedArgs.length === 1) {
      const only = parsedArgs[0]!;
      await runAnalyzeCommand(only.owner, only.repo);
      return;
    }

    const payloads = await mapWithConcurrency(
      parsedArgs,
      ANALYZE_FETCH_CONCURRENCY,
      async (item) => getAnalyzePayload(item.owner, item.repo)
    );
    for (let i = 0; i < payloads.length; i++) {
      printAnalyzeResult(payloads[i]!);
      if (i < payloads.length - 1) {
        console.log("");
      }
    }
    return;
  }

  if (loc) {
    if (jsonOutput) {
      const payloads = await mapWithConcurrency(
        parsedArgs,
        LOC_FETCH_CONCURRENCY,
        async (item) => getLocPayload(item.owner, item.repo)
      );
      console.log(
        JSON.stringify(payloads.length === 1 ? payloads[0] : payloads, null, 2)
      );
      return;
    }

    if (parsedArgs.length === 1) {
      const only = parsedArgs[0]!;
      await runLocCommand(only.owner, only.repo);
      return;
    }

    const payloads = await mapWithConcurrency(
      parsedArgs,
      LOC_FETCH_CONCURRENCY,
      async (item) => getLocPayload(item.owner, item.repo)
    );
    for (let i = 0; i < payloads.length; i++) {
      printLocResult(payloads[i]!);
      if (i < payloads.length - 1) {
        console.log("");
      }
    }
    return;
  }

  const results = await mapWithConcurrency(
    parsedArgs,
    REPO_METADATA_CONCURRENCY,
    async (item) => {
      const metadata = await fetchRepositoryMetadata(item.owner, item.repo);
      return buildPayload(item.input, metadata);
    }
  );

  const sorted = sortRepoRows(results, sort);

  if (jsonOutput) {
    console.log(
      JSON.stringify(sorted.length === 1 ? sorted[0] : sorted, null, 2)
    );
    return;
  }

  if (sorted.length === 1) {
    const result = sorted[0]!;
    const only = parsedArgs[0]!;
    const loc = await getLocPayload(only.owner, only.repo);
    console.log(`Repository: ${result.repository}`);
    console.log(`Size: ${formatSizeFromKb(result.size_mb * 1024)}`);
    console.log(`Lines: ${formatCompactCount(loc.total_lines)} `);
    console.log(`Stars: ${formatStars(result.stars)}`);
    console.log(`Language: ${result.language}`);
    return;
  }

  console.log(`Comparing ${sorted.length} repositories (sorted by ${sort}):`);
  console.log("");
  console.log(renderOrgTable(sorted));
}

export async function runOrganizationCommand(
  organization: string,
  jsonOutput: boolean,
  limit: number
): Promise<void> {
  const repositories = await fetchOrganizationRepositories(organization, limit);
  const payload = repositories
    .map((repo) => ({
      repository: repo.fullName,
      size_mb: kbToMbRounded(repo.sizeKb),
      stars: repo.stargazersCount,
      language: repo.language ?? "Unknown"
    }))
    .sort((a, b) => b.size_mb - a.size_mb);

  if (jsonOutput) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Organization: ${organization}`);
  console.log(`Repositories scanned: ${payload.length}`);
  console.log("");

  if (payload.length === 0) {
    console.log(
      "No repositories to show. The organization may have no visible repos, or all of them may be archived or disabled."
    );
    return;
  }

  console.log(renderOrgTable(payload));
}
