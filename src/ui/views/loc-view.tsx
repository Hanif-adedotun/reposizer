import React from "react";
import { Box, Text } from "ink";

import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Heading } from "../../../components/ui/heading";
import { Table } from "../../../components/ui/table";
import type { LocJsonResult } from "../../commands/loc";
import { formatCompactCount } from "../../utils/size";
import { getTerminalWidth } from "../../utils/text";

function computeLocColumnWidths(
  files: LocJsonResult["top_files"],
  linesValues: string[]
) {
  const maxWidth = getTerminalWidth();
  const columnCount = 3;
  const borders = columnCount * 3 + 1;

  const linesWidth = Math.max(
    5,
    "Lines".length,
    ...linesValues.map((value) => value.length)
  );
  const languageWidth = Math.max(
    8,
    "Language".length,
    ...files.map((file) => file.language.length)
  );

  const fixedSum = linesWidth + languageWidth;
  const maxFile = maxWidth - fixedSum - borders;
  const idealFile = Math.max(
    "File".length,
    ...files.map((file) => file.path.length)
  );
  const fileWidth = Math.max(10, Math.min(idealFile, maxFile));

  return {
    file: fileWidth,
    lines: linesWidth,
    language: languageWidth
  };
}

export function LocView({ payload }: { payload: LocJsonResult }) {
  const tableData = payload.top_files.map((file) => ({
    file: file.path,
    lines: formatCompactCount(file.lines),
    language: file.language
  }));
  const widths = computeLocColumnWidths(
    payload.top_files,
    tableData.map((row) => row.lines)
  );

  return (
    <Box flexDirection="column">
      {payload.truncated && (
        <Alert variant="warning" title="Truncated">
          Git tree response was truncated by GitHub; LOC totals may be
          incomplete.
        </Alert>
      )}
      <Heading level={2}>{payload.repository}</Heading>
      <Box marginBottom={1} flexDirection="row" gap={1}>
        <Text>Total LOC</Text>
        <Badge variant="warning" bordered={false}>
          approx
        </Badge>
        <Text>: {formatCompactCount(payload.total_lines)}</Text>
      </Box>
      <Table
        data={tableData}
        columns={[
          { key: "file", header: "File", width: widths.file },
          { key: "lines", header: "Lines", width: widths.lines, align: "right" },
          {
            key: "language",
            header: "Language",
            width: widths.language
          }
        ]}
        maxRows={10}
        maxWidth={getTerminalWidth()}
      />
    </Box>
  );
}
