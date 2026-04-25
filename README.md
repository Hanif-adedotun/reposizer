# reposizer

> Fast CLI to inspect GitHub repository sizes.

Check repo size before you clone. Analyze large codebases instantly.

## Demo

```bash
npx reposizer torvalds/linux
```

```text
Repository: torvalds/linux
Size: 4.82 GB
Stars: 190k
Language: C
```

## Features

- ⚡ Instant repository size lookup
- 🔐 Supports private repositories via `GITHUB_TOKEN`
- 📦 Works with `npx` (no global install required)
- 🧩 JSON output for scripts and CI tooling
- 🏢 Organization repository scanning
- 🔎 Current repository auto-detection (via git remote)
- 📚 Multi-repository lookup in one command
- 📊 Directory analysis (planned)

## Installation

### Option 1: no install (recommended)

```bash
npx reposizer owner/repo
```

### Option 2: global install

```bash
npm install -g reposizer
```

## Usage

### Check repository size

```bash
reposizer openai/gym
```

### Check multiple repositories

```bash
reposizer openai/gym vercel/next.js torvalds/linux
```

### Detect current repository automatically

```bash
reposizer
```

### Scan an organization

```bash
reposizer org openai
reposizer org openai --limit 50 --json
```

### JSON output

```bash
reposizer openai/gym --json
```

### Private repository access

```bash
export GITHUB_TOKEN=your_token
reposizer your-org/private-repo
```

## Example JSON Output

```json
{
  "repository": "openai/gym",
  "size_mb": 92.15,
  "stars": 31000,
  "language": "Python"
}
```

## Roadmap

- [x] Organization scanning
- [x] Current repository auto-detection
- [x] Multi-repository support
- [ ] Directory size analysis
- [ ] CI/CD threshold mode
- [ ] Repository growth tracking

## Why

Cloning a massive repository blindly is painful. Reposizer helps you inspect before you pull.

## Security Notes

- `GITHUB_TOKEN` is optional and used only for request authorization.
- Tokens are never printed to output or written to disk.

## License

MIT - see [`LICENSE`](LICENSE).
