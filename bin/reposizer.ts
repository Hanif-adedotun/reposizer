#!/usr/bin/env node

import { Command } from "commander";
import {
  runOrganizationCommand,
  runRepositoriesCommand
} from "../src/commands/repo";

const program = new Command();

program
  .name("reposizer")
  .description("Fast CLI to inspect GitHub repository sizes");

program
  .argument("[repositories...]", "One or more repositories in owner/repo format")
  .option("--json", "Return machine-readable JSON output")
  .action(async (repositories: string[] = [], options: { json?: boolean }) => {
    try {
      await runRepositoriesCommand(repositories, Boolean(options.json));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred";
      console.error(`Error: ${message}`);
      process.exitCode = 1;
    }
  })
  .addHelpText(
    "after",
    "\nExamples:\n  reposizer openai/gym\n  reposizer openai/gym vercel/next.js\n  reposizer --json"
  );

program
  .command("org")
  .description("Scan repositories in a GitHub organization")
  .argument("<organization>", "GitHub organization name")
  .option("--limit <number>", "Maximum repositories to scan (1-100)", "30")
  .option("--json", "Return machine-readable JSON output")
  .action(
    async (
      organization: string,
      options: { limit: string; json?: boolean }
    ) => {
      try {
        const limit = Number.parseInt(options.limit, 10);
        if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
          throw new Error("Invalid --limit value. Use a number between 1 and 100.");
        }

        await runOrganizationCommand(organization, Boolean(options.json), limit);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error occurred";
        console.error(`Error: ${message}`);
        process.exitCode = 1;
      }
    }
  );

program.parseAsync(process.argv);
