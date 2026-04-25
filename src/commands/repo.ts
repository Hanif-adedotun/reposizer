import {
  fetchOrganizationRepositories,
  fetchRepositoryMetadata
} from "../services/github";
import { detectCurrentRepositoryFromGitRemote } from "../utils/git";
import { formatSizeFromKb, formatStars, kbToMbRounded } from "../utils/size";

function parseRepository(input: string): { owner: string; repo: string } {
  const trimmed = input.trim();
  const match = /^([^/\s]+)\/([^/\s]+)$/.exec(trimmed);
  if (!match) {
    throw new Error("Invalid repository format. Use owner/repo.");
  }
  return { owner: match[1], repo: match[2] };
}

export async function runRepoCommand(
  repositoryInput: string,
  jsonOutput: boolean
): Promise<void> {
  const { owner, repo } = parseRepository(repositoryInput);
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
  jsonOutput: boolean
): Promise<void> {
  const effectiveInputs =
    repositoryInputs.length > 0
      ? repositoryInputs
      : [detectCurrentRepositoryFromGitRemote()];

  const results = await Promise.all(
    effectiveInputs.map(async (input) => {
      const { owner, repo } = parseRepository(input);
      const metadata = await fetchRepositoryMetadata(owner, repo);
      return buildPayload(input, metadata);
    })
  );

  if (jsonOutput) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
    return;
  }

  for (const result of results) {
    console.log(`Repository: ${result.repository}`);
    console.log(`Size: ${formatSizeFromKb(result.size_mb * 1024)}`);
    console.log(`Stars: ${formatStars(result.stars)}`);
    console.log(`Language: ${result.language}`);
    console.log("");
  }
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
  console.log(renderOrgTable(payload));
}
