import Convert from "ansi-to-html";
import React from "react";
import { renderToString } from "ink";

import { ThemeProvider } from "../../components/ui/theme-provider";
import { githubTheme } from "../../lib/terminal-themes/github";
import { withTerminalWidth } from "../utils/text";

process.env.FORCE_COLOR ??= "3";

const ansiConverter = new Convert({
  bg: githubTheme.colors.background,
  fg: githubTheme.colors.foreground,
  newline: true,
  escapeXML: true,
  stream: false
});

export function renderPreviewAnsi(
  element: React.ReactElement,
  columns = 52
): string {
  return withTerminalWidth(columns, () =>
    renderToString(
      <ThemeProvider theme={githubTheme}>{element}</ThemeProvider>,
      { columns }
    ).replace(/\n$/, "")
  );
}

export function renderPreviewHtml(
  element: React.ReactElement,
  columns = 52
): string {
  return ansiConverter.toHtml(renderPreviewAnsi(element, columns));
}
