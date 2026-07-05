import {
  fetchOrganizationRepositories,
  fetchRepositoryMetadata
} from "../services/github";
import {
  getAnalyzePayload,
  runAnalyzeCommand
} from "./analyze";
import { getLocPayload, runLocCommand } from "./loc";
import { detectCurrentRepositoryFromGitRemote } from "../utils/git";
import { kbToMbRounded } from "../utils/size";
import { renderStatic, maybeLoading, withLoading } from "../ui/render";
import {
  OrgScanView,
  RepoTableView,
  SingleRepoView,
  type RepoRow
} from "../ui/views/repo-view";
import { AnalyzeView } from "../ui/views/analyze-view";
import { LocView } from "../ui/views/loc-view";

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

function sortRepoRows(rows: RepoRow[], sort: MultiRepoSort): RepoRow[] {
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
  const metadata = await maybeLoading(!jsonOutput, `Fetching ${owner}/${repo}…`, () =>
    fetchRepositoryMetadata(owner, repo)
  );

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

  const loc = await maybeLoading(!jsonOutput, "Estimating lines of code…", () =>
    getLocPayload(owner, repo)
  );
  renderStatic(
    <SingleRepoView
      repository={metadata.fullName}
      sizeKb={metadata.sizeKb}
      stars={metadata.stargazersCount}
      language={metadata.language ?? "Unknown"}
      totalLines={loc.total_lines}
    />
  );
}

function buildPayload(
  repositoryInput: string,
  metadata: Awaited<ReturnType<typeof fetchRepositoryMetadata>>
): RepoRow {
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
      const payloads = await maybeLoading(!jsonOutput, "Analyzing repositories…", () =>
        mapWithConcurrency(parsedArgs, ANALYZE_FETCH_CONCURRENCY, async (item) =>
          getAnalyzePayload(item.owner, item.repo)
        )
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

    const payloads = await withLoading("Analyzing repositories…", () =>
      mapWithConcurrency(parsedArgs, ANALYZE_FETCH_CONCURRENCY, async (item) =>
        getAnalyzePayload(item.owner, item.repo)
      )
    );
    for (let i = 0; i < payloads.length; i++) {
      renderStatic(<AnalyzeView payload={payloads[i]!} />);
      if (i < payloads.length - 1) {
        console.log("");
      }
    }
    return;
  }

  if (loc) {
    if (jsonOutput) {
      const payloads = await maybeLoading(!jsonOutput, "Analyzing lines of code…", () =>
        mapWithConcurrency(parsedArgs, LOC_FETCH_CONCURRENCY, async (item) =>
          getLocPayload(item.owner, item.repo)
        )
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

    const payloads = await withLoading("Analyzing lines of code…", () =>
      mapWithConcurrency(parsedArgs, LOC_FETCH_CONCURRENCY, async (item) =>
        getLocPayload(item.owner, item.repo)
      )
    );
    for (let i = 0; i < payloads.length; i++) {
      renderStatic(<LocView payload={payloads[i]!} />);
      if (i < payloads.length - 1) {
        console.log("");
      }
    }
    return;
  }

  const results = await maybeLoading(!jsonOutput, "Fetching repository metadata…", () =>
    mapWithConcurrency(parsedArgs, REPO_METADATA_CONCURRENCY, async (item) => {
      const metadata = await fetchRepositoryMetadata(item.owner, item.repo);
      return buildPayload(item.input, metadata);
    })
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
    const locPayload = await maybeLoading(true, "Estimating lines of code…", () =>
      getLocPayload(only.owner, only.repo)
    );
    renderStatic(
      <SingleRepoView
        repository={result.repository}
        sizeKb={result.size_mb * 1024}
        stars={result.stars}
        language={result.language}
        totalLines={locPayload.total_lines}
      />
    );
    return;
  }

  renderStatic(
    <RepoTableView
      title={`Comparing ${sorted.length} repositories`}
      subtitle={`Sorted by ${sort}`}
      rows={sorted}
    />
  );
}

export async function runOrganizationCommand(
  organization: string,
  jsonOutput: boolean,
  limit: number
): Promise<void> {
  const repositories = await maybeLoading(!jsonOutput, `Scanning ${organization} repositories…`, () =>
    fetchOrganizationRepositories(organization, limit)
  );
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

  renderStatic(
    <OrgScanView organization={organization} rows={payload} />
  );
}
