export type RepoMetadata = {
  fullName: string;
  sizeKb: number;
  stargazersCount: number;
  language: string | null;
};

type GitHubRepoResponse = {
  full_name: string;
  size: number;
  stargazers_count: number;
  language: string | null;
};

type GitHubOrgRepoResponse = {
  full_name: string;
  size: number;
  stargazers_count: number;
  language: string | null;
  archived: boolean;
  disabled: boolean;
  private: boolean;
};

function createHeaders(token: string | undefined): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "reposizer-cli"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getErrorMessage(status: number): string {
  if (status === 404) {
    return "Repository not found. Check the owner/repo value.";
  }
  if (status === 401 || status === 403) {
    return "GitHub API access denied. Verify GITHUB_TOKEN or rate limits.";
  }
  return `GitHub API returned status ${status}.`;
}

export async function fetchRepositoryMetadata(
  owner: string,
  repo: string,
  token = process.env.GITHUB_TOKEN
): Promise<RepoMetadata> {
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: createHeaders(token),
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    throw new Error(
      "Unable to reach GitHub API. Check your network and try again."
    );
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status));
  }

  const data = (await response.json()) as GitHubRepoResponse;

  return {
    fullName: data.full_name,
    sizeKb: data.size,
    stargazersCount: data.stargazers_count,
    language: data.language
  };
}

export async function fetchOrganizationRepositories(
  org: string,
  limit = 30,
  token = process.env.GITHUB_TOKEN
): Promise<RepoMetadata[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const endpoint = `https://api.github.com/orgs/${encodeURIComponent(org)}/repos?per_page=${safeLimit}&sort=updated&direction=desc`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: createHeaders(token),
      signal: AbortSignal.timeout(7000)
    });
  } catch {
    throw new Error(
      "Unable to reach GitHub API. Check your network and try again."
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Organization not found.");
    }
    throw new Error(getErrorMessage(response.status));
  }

  const data = (await response.json()) as GitHubOrgRepoResponse[];
  return data
    .filter((repo) => !repo.archived && !repo.disabled)
    .map((repo) => ({
      fullName: repo.full_name,
      sizeKb: repo.size,
      stargazersCount: repo.stargazers_count,
      language: repo.language
    }));
}
