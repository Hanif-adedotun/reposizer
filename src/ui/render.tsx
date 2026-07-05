import React from "react";
import { render, renderToString } from "ink";

import { ThemeProvider } from "../../components/ui/theme-provider";
import { StatusMessage } from "../../components/ui/status-message";
import { githubTheme } from "../../lib/terminal-themes/github";

function withTheme(element: React.ReactElement): React.ReactElement {
  return <ThemeProvider theme={githubTheme}>{element}</ThemeProvider>;
}

export function renderStatic(element: React.ReactElement): void {
  console.log(renderToString(withTheme(element)));
}

export function renderError(element: React.ReactElement): void {
  console.error(renderToString(withTheme(element)));
}

export async function withLoading<T>(
  message: string,
  work: () => Promise<T>
): Promise<T> {
  const instance = render(withTheme(<StatusMessage variant="loading">{message}</StatusMessage>), {
    exitOnCtrlC: false
  });
  try {
    return await work();
  } finally {
    instance.unmount();
  }
}

export async function maybeLoading<T>(
  enabled: boolean,
  message: string,
  work: () => Promise<T>
): Promise<T> {
  if (!enabled) {
    return work();
  }
  return withLoading(message, work);
}
