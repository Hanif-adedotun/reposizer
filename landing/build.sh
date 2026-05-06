#!/usr/bin/env bash
export PATH="$HOME/.bun/bin:$PATH"

bun install --frozen-lockfile

bun run build
