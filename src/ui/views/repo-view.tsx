import React from "react";
import { Box, Text } from "ink";

import { Badge } from "../../../components/ui/badge";
import { Card } from "../../../components/ui/card";
import { Heading } from "../../../components/ui/heading";
import { KeyValue } from "../../../components/ui/key-value";
import { Table } from "../../../components/ui/table";
import {
  formatCompactCount,
  formatSizeFromKb,
  formatStars
} from "../../utils/size";

export type RepoRow = {
  repository: string;
  size_mb: number;
  stars: number;
  language: string;
};

type SingleRepoViewProps = {
  repository: string;
  sizeKb: number;
  stars: number;
  language: string;
  totalLines?: number;
};

export function SingleRepoView({
  repository,
  sizeKb,
  stars,
  language,
  totalLines
}: SingleRepoViewProps) {
  const items = [
    { key: "Size", value: formatSizeFromKb(sizeKb) },
    ...(totalLines !== undefined
      ? [{ key: "Lines", value: formatCompactCount(totalLines) }]
      : []),
    { key: "Stars", value: formatStars(stars) }
  ];

  return (
    <Card title={repository}>
      <KeyValue items={items} />
      <Box flexDirection="row" gap={1} marginTop={1}>
        <Text dimColor>Language:</Text>
        <Badge variant="secondary">{language}</Badge>
      </Box>
    </Card>
  );
}

type RepoTableViewProps = {
  title: string;
  subtitle?: string;
  rows: RepoRow[];
};

function toTableData(rows: RepoRow[]) {
  return rows.map((row) => ({
    repository: row.repository,
    size: formatSizeFromKb(row.size_mb * 1024),
    stars: formatStars(row.stars),
    language: row.language
  }));
}

export function RepoTableView({ title, subtitle, rows }: RepoTableViewProps) {
  return (
    <Box flexDirection="column">
      <Heading level={2}>{title}</Heading>
      {subtitle && (
        <Text dimColor color="gray">
          {subtitle}
        </Text>
      )}
      <Table
        data={toTableData(rows)}
        columns={[
          { key: "repository", header: "Repository", width: 48 },
          { key: "size", header: "Size", align: "right" },
          { key: "stars", header: "Stars", align: "right" },
          { key: "language", header: "Language" }
        ]}
        maxRows={100}
      />
    </Box>
  );
}

type OrgScanViewProps = {
  organization: string;
  rows: RepoRow[];
};

export function OrgScanView({ organization, rows }: OrgScanViewProps) {
  return (
    <Box flexDirection="column">
      <Heading level={1}>{organization}</Heading>
      <Text dimColor>Repositories scanned: {rows.length}</Text>
      {rows.length === 0 ? (
        <Text>
          No repositories to show. The organization may have no visible repos,
          or all of them may be archived or disabled.
        </Text>
      ) : (
        <RepoTableView title="Repositories" rows={rows} />
      )}
    </Box>
  );
}
