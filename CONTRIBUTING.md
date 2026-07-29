# Contributing to ChalkPicks Pro

Thank you for your interest in contributing to ChalkPicks Pro — an AI-powered sports betting analytics platform. This document outlines the process for contributing code, reporting bugs, and suggesting features.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Security Vulnerabilities](#security-vulnerabilities)

---

## Code of Conduct

This project follows a standard code of conduct. Be respectful, constructive, and professional in all interactions. Harassment, discrimination, or abusive behavior will not be tolerated.

---

## Getting Started

Before contributing, please:

1. Check the [open issues](https://github.com/big-main/chalkpicks-pro/issues) to see if your bug or feature is already tracked.
2. For significant changes, open an issue first to discuss the approach before writing code.
3. Fork the repository and create your branch from `main`.

---

## Development Setup

### Prerequisites

- Node.js 22+
- pnpm 9+
- A MySQL/TiDB database (connection string in `.env`)

### Installation

```bash
git clone https://github.com/big-main/chalkpicks-pro.git
cd chalkpicks-pro
pnpm install
cp .env.example .env   # fill in your environment variables
pnpm dev
```

The dev server starts at `http://localhost:3000`.

### Key Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest test suite |
| `pnpm test --run` | Run tests once (CI mode) |
| `pnpm drizzle-kit generate` | Generate DB migration SQL |
| `pnpm drizzle-kit studio` | Open Drizzle Studio |

---

## Branching Strategy

- `main` — production-ready code, auto-deploys on merge
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance, dependency updates, refactors

Branch names should be lowercase with hyphens (e.g., `feature/ev-finder-v2`).

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Examples:**
```
feat(picks): add AI confidence score to pick cards
fix(sitemap): remove paywall-gated pick pages from sitemap
perf(home): lazy-load Recharts chart to reduce TBT
```

---

## Pull Request Process

1. Ensure your branch is up to date with `main` before opening a PR.
2. Run `pnpm test --run` and confirm all tests pass.
3. Update `CHANGELOG.md` under `[Unreleased]` with a summary of your changes.
4. Fill in the PR template completely.
5. Request a review from a maintainer.
6. PRs are squash-merged into `main`.

---

## Testing

All new features and bug fixes must include Vitest tests. Tests live in `server/*.test.ts`.

```bash
pnpm test          # watch mode
pnpm test --run    # single run (CI)
```

Coverage targets: aim for >80% on new code paths.

---

## Security Vulnerabilities

**Do not open a public issue for security vulnerabilities.**

Please report security issues privately by emailing: **security@chalkpicks.live**

Include a description of the vulnerability, reproduction steps, and potential impact. We aim to respond within 48 hours and patch critical issues within 7 days.

---

## Questions?

Open a [GitHub Discussion](https://github.com/big-main/chalkpicks-pro/discussions) or reach out via the community Discord linked on [chalkpicks.live](https://chalkpicks.live).
