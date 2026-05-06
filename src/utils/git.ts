import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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

  const sshProtocolMatch = /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/.exec(
    normalized
  );
  if (sshProtocolMatch) {
    return `${sshProtocolMatch[1]}/${sshProtocolMatch[2]}`;
  }

  return null;
}

function findGitDirectory(startDir: string): string | null {
  let current = resolve(startDir);

  while (true) {
    const dotGitPath = join(current, ".git");
    if (existsSync(dotGitPath)) {
      const stats = statSync(dotGitPath);
      if (stats.isDirectory()) {
        return dotGitPath;
      }
      if (stats.isFile()) {
        const fileContent = readFileSync(dotGitPath, "utf8");
        const match = /^\s*gitdir:\s*(.+)\s*$/im.exec(fileContent);
        if (match?.[1]) {
          return resolve(current, match[1].trim());
        }
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function getOriginRemoteUrlFromConfig(configPath: string): string {
  const configContent = readFileSync(configPath, "utf8");
  const lines = configContent.split(/\r?\n/);

  let inOriginSection = false;
  const originUrls: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith(";") || line.startsWith("#")) {
      continue;
    }

    const sectionMatch = /^\[(.+)\]$/.exec(line);
    if (sectionMatch) {
      inOriginSection = sectionMatch[1]?.trim() === 'remote "origin"';
      continue;
    }

    if (!inOriginSection) {
      continue;
    }

    const keyValueMatch = /^([A-Za-z0-9\-.]+)\s*=\s*(.+)$/.exec(line);
    if (keyValueMatch?.[1] === "url") {
      originUrls.push(keyValueMatch[2]!.trim());
    }
  }

  if (originUrls.length === 0) {
    throw new Error(
      "No repository argument provided and no remote \"origin\" URL was found in .git/config."
    );
  }
  if (originUrls.length > 1) {
    throw new Error(
      "Multiple remote \"origin\" URLs were found in .git/config. Pass owner/repo explicitly."
    );
  }

  return originUrls[0]!;
}

export function detectCurrentRepositoryFromGitRemote(): string {
  const gitDir = findGitDirectory(process.cwd());
  if (!gitDir) {
    throw new Error(
      "No repository argument provided and no .git directory was found in this path."
    );
  }

  const configPath = join(gitDir, "config");
  if (!existsSync(configPath)) {
    throw new Error(
      "Found .git directory but no config file. Pass owner/repo explicitly."
    );
  }

  const remoteUrl = getOriginRemoteUrlFromConfig(configPath);
  const ownerRepo = parseRemoteToOwnerRepo(remoteUrl);
  if (!ownerRepo) {
    throw new Error(
      "Unable to parse origin remote from .git/config. Expected a GitHub URL."
    );
  }

  return ownerRepo;
}
