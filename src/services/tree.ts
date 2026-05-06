import { createHeaders, getErrorMessage } from "./github";

const BASE = "https://api.github.com";

export type GitTreeEntry = {
  path: string;
  type: string;
  size?: number;
};

export type GitTreeResult = {
  tree: GitTreeEntry[];
  truncated: boolean;
};

export async function getRepoTree(
  owner: string,
  repo: string,
  token = process.env.GITHUB_TOKEN
): Promise<GitTreeResult> {
  const repoEndpoint = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  let repoResponse: Response;
  try {
    repoResponse = await fetch(repoEndpoint, {
      method: "GET",
      headers: createHeaders(token),
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    throw new Error(
      "Unable to reach GitHub API. Check your network and try again."
    );
  }

  if (!repoResponse.ok) {
    throw new Error(getErrorMessage(repoResponse.status));
  }

  const repoData = (await repoResponse.json()) as { default_branch?: string };
  const branch = repoData.default_branch;
  if (!branch) {
    throw new Error("GitHub API response missing default branch.");
  }

  const treeEndpoint = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;

  let treeResponse: Response;
  try {
    treeResponse = await fetch(treeEndpoint, {
      method: "GET",
      headers: createHeaders(token),
      signal: AbortSignal.timeout(30_000)
    });
  } catch {
    throw new Error(
      "Unable to reach GitHub API. Check your network and try again."
    );
  }

  if (!treeResponse.ok) {
    throw new Error(getErrorMessage(treeResponse.status));
  }

  const treeData = (await treeResponse.json()) as {
    tree?: GitTreeEntry[];
    truncated?: boolean;
  };

  return {
    tree: treeData.tree ?? [],
    truncated: Boolean(treeData.truncated)
  };
}
