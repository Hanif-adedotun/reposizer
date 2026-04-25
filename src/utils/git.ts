import { execFileSync } from "node:child_process";

function parseRemoteToOwnerRepo(remoteUrl: string): string | null {
  const normalized = remoteUrl.trim().replace(/\.git$/, "");

  const sshMatch = /^git@github\.com:([^/]+)\/([^/]+)$/.exec(normalized);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  const httpsMatch = /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/.exec(
    normalized
  );
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  return null;
}

export function detectCurrentRepositoryFromGitRemote(): string {
  let remoteUrl = "";
  try {
    remoteUrl = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    throw new Error(
      "No repository argument provided and no git origin remote was detected."
    );
  }

  const ownerRepo = parseRemoteToOwnerRepo(remoteUrl);
  if (!ownerRepo) {
    throw new Error(
      "Unable to parse git remote. Expected a GitHub origin remote URL."
    );
  }

  return ownerRepo;
}
