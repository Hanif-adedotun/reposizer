import React from "react";
import { Box, Text } from "ink";

import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { BarChart } from "../../../components/ui/bar-chart";
import { Divider } from "../../../components/ui/divider";
import { Heading } from "../../../components/ui/heading";
import type { LocJsonResult } from "../../commands/loc";
import { formatCompactCount } from "../../utils/size";

export function LocView({ payload }: { payload: LocJsonResult }) {
  const languageData = payload.by_language.map(({ language, lines }) => ({
    label: `${language.padEnd(15)} ${formatCompactCount(lines)}`,
    value: lines
  }));
  const directoryData = payload.by_directory.map(({ directory, lines }) => ({
    label: `${directory.padEnd(15)} ${formatCompactCount(lines)}`,
    value: lines
  }));

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
      <Divider label="Top languages" />
      <BarChart data={languageData} showValues={false} width={40} />
      <Box marginTop={1}>
        <Divider label="Top directories" />
        <BarChart data={directoryData} showValues={false} width={40} />
      </Box>
    </Box>
  );
}
