# Contributing to nextjs-pdf-viewer

Thanks for your interest in contributing! This guide explains how to propose changes, report issues, and submit pull requests.

## Ways to contribute
- Report bugs and regressions
- Suggest features and improvements
- Improve documentation and examples
- Fix code quality issues and type correctness

## Before you file an issue
- Search existing issues to avoid duplicates
- Include: steps to reproduce, expected vs actual, browser/OS, screenshots/logs
- For rendering/search bugs, attach or describe the PDF (fonts, rotation, size)

## Development setup
```bash
git clone https://github.com/yourusername/nextjs-pdf-viewer.git
cd nextjs-pdf-viewer
npm install
npm run dev        # watch build to dist/
```

Useful scripts:
- `npm run build` – production build
- `npm run typecheck` – TypeScript checks

## Coding standards
- Prefer clarity over cleverness; avoid deep nesting; use early returns
- Strong types for public APIs; avoid `any` in exported surfaces
- Keep comments focused on non-obvious rationale and invariants
- No unrelated refactors in the same PR

## Commit and PR guidelines
- Branch from `main` and rebase if necessary
- Small, focused PRs with a clear description
- Reference related issues (e.g., `Fixes #123`)
- Include screenshots/GIFs for UI-visible changes
- Confirm no linter/type errors and no broken builds

### PR checklist
- [ ] Builds locally (`npm run build`)
- [ ] Type checks pass (`npm run typecheck`)
- [ ] Changes are scoped (no unrelated diffs)
- [ ] Docs updated if user-facing behavior changes

## Release and versioning
Maintainers follow semver. Breaking changes require a major version bump and clear migration notes.

## Code of Conduct
Be respectful and constructive. Assume good intent. We foster a welcoming, inclusive community.

## Questions and discussions
Use GitHub Discussions or open a question-labeled issue for design/UX/API feedback.
