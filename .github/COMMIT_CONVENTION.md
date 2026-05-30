# Commit Message Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint and Husky.

## Format

```
<type>(<optional scope>): <subject>

<optional body>

<optional footer>
```

## Rules

- Header max **100 characters** (type + scope + subject)
- Body lines max **100 characters** each
- Subject: imperative mood, lowercase, no trailing period
- Required **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Do not mention AI tools, agents, or IDE attribution in commit messages
- Do not add `Co-authored-by` or `Made-with` trailers unless a human co-author explicitly requests it

## Examples

```
feat(api): add health check handler
fix(auth): validate JWT expiry before tenant lookup
chore: bootstrap monorepo with Terraform and CI
```

## IDE setup

- Git commit template: `.gitmessage` (configured in `.vscode/settings.json`)
- Husky `prepare-commit-msg` strips unwanted attribution trailers before commit
