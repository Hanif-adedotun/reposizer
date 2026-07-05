import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  entryPoints: [path.join(rootDir, "bin/reposizer.tsx")],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: path.join(rootDir, "dist/bin/reposizer.js"),
  alias: {
    "@": rootDir
  },
  loader: {
    ".tsx": "tsx",
    ".ts": "ts"
  },
  target: "node18",
  sourcemap: true
});

console.log("Built dist/bin/reposizer.js");
