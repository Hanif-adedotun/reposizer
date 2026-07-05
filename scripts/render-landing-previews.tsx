import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import React from "react";

import {
  analyzePayload,
  compareRows,
  currentRepo,
  heroRepo,
  locPayload,
  previewColumns,
  singleRepo
} from "./landing-preview-fixtures";
import { renderPreviewHtml } from "../src/ui/render-preview";
import { AnalyzeView } from "../src/ui/views/analyze-view";
import { LocView } from "../src/ui/views/loc-view";
import {
  RepoTableView,
  SingleRepoView
} from "../src/ui/views/repo-view";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(rootDir, "landing/src/generated");
const outFile = path.join(outDir, "previews.json");

const previews = {
  hero: renderPreviewHtml(
    <SingleRepoView {...heroRepo} />,
    previewColumns.hero
  ),
  single: renderPreviewHtml(
    <SingleRepoView {...singleRepo} />,
    previewColumns.card
  ),
  compare: renderPreviewHtml(
    <RepoTableView title="Repositories" rows={compareRows} />,
    previewColumns.table
  ),
  analyze: renderPreviewHtml(
    <AnalyzeView payload={analyzePayload} />,
    previewColumns.wide
  ),
  loc: renderPreviewHtml(
    <LocView payload={locPayload} />,
    previewColumns.wide
  ),
  current: renderPreviewHtml(
    <SingleRepoView {...currentRepo} />,
    previewColumns.card
  ),
  docs: renderPreviewHtml(
    <RepoTableView title="Repositories" rows={[...compareRows].reverse()} />,
    previewColumns.table
  )
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(previews, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(rootDir, outFile)}`);
