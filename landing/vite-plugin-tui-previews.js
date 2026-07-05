import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function generatePreviews() {
  const result = spawnSync(
    "npx",
    ["tsx", path.join(repoRoot, "scripts/render-landing-previews.tsx")],
    {
      cwd: repoRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        FORCE_COLOR: "3"
      }
    }
  );

  if (result.status !== 0) {
    throw new Error("Failed to generate landing TUI previews");
  }
}

export function tuiPreviewsPlugin() {
  return {
    name: "reposizer-tui-previews",
    buildStart() {
      generatePreviews();
    },
    configureServer() {
      generatePreviews();
    }
  };
}
