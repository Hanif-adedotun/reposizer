import React from "react";
import { Box, Text } from "ink";

import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { BarChart } from "../../../components/ui/bar-chart";
import { Divider } from "../../../components/ui/divider";
import { Heading } from "../../../components/ui/heading";
import type { AnalyzeJsonResult } from "../../commands/analyze";
import { formatBytes } from "../../utils/size";

export function AnalyzeView({ payload }: { payload: AnalyzeJsonResult }) {
  const chartData = payload.top_directories.map(({ directory, bytes }) => ({
    label: `${directory.padEnd(15)} ${formatBytes(bytes)}`,
    value: bytes
  }));

  return (
    <Box flexDirection="column">
      {payload.truncated && (
        <Alert variant="warning" title="Truncated">
          Git tree response was truncated by GitHub; directory totals may be
          incomplete.
        </Alert>
      )}
      <Heading level={2}>{payload.repository}</Heading>
      <Box marginBottom={1} flexDirection="row" gap={1}>
        <Text>Total</Text>
        <Badge variant="warning" bordered={false}>
          approx
        </Badge>
        <Text>: {formatBytes(payload.total_bytes)}</Text>
      </Box>
      <Divider label="Top directories" />
      <BarChart data={chartData} showValues={false} width={40} />
    </Box>
  );
}
