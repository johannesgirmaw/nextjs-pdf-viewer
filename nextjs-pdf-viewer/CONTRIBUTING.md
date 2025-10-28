# Contributing to AI PDF Viewer

Thank you for your interest in contributing to AI PDF Viewer! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/pdf-viewer.git
   cd ai-pdf-viewer
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/yohannes/pdf-viewer.git
   ```

## Development Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the project**:

   ```bash
   npm run build
   ```

3. **Run in development mode**:

   ```bash
   npm run dev
   ```

4. **Type check**:

   ```bash
   npm run typecheck
   ```

## Making Changes

### Branch Naming

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Examples:

```
feat: add text layer support for accessibility
fix: resolve zoom highlighting issues on mobile
docs: update API documentation
```

## Submitting Changes

1. **Ensure your changes work**:

   ```bash
   npm run typecheck
   npm run build
   ```

2. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check if it's already fixed** in the latest version
3. **Provide clear reproduction steps**

### Issue Templates

Use the appropriate issue template:

- **Bug Report**: For unexpected behavior
- **Feature Request**: For new functionality
- **Documentation**: For documentation improvements

### Required Information

For bug reports, include:

- **Browser and version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Console errors** (if any)

## Pull Request Guidelines

### Before Submitting

- [ ] **Code follows project conventions**
- [ ] **TypeScript types are properly defined**
- [ ] **No console.log statements**
- [ ] **Documentation is updated** (if needed)
- [ ] **Commits are squashed** (if multiple commits)

### PR Description

Include:

- **What changes were made**
- **Why the changes were necessary**
- **How to test the changes**
- **Screenshots** (for UI changes)
- **Breaking changes** (if any)

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in different browsers
4. **Approval** from at least one maintainer

## Coding Standards

### TypeScript

- **Strict mode enabled**
- **Explicit return types** for public methods
- **Proper error handling**
- **No `any` types** unless absolutely necessary

### Code Style

- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings
- **Trailing commas** in objects/arrays
- **Meaningful variable names**

### File Organization

```
src/
├── index.ts              # Main exports
├── types/                # Type definitions
├── viewer/               # Core viewer logic
└── web-component/        # Web component implementation
```

## Testing

### Manual Testing

Test your changes in:

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)
- **Mobile browsers**

### Test Cases

- **PDF loading** with different file sizes
- **Search functionality** with various queries
- **Zoom levels** from 50% to 300%
- **Keyboard shortcuts**
- **Responsive behavior**

## Documentation

### Code Documentation

- **JSDoc comments** for public APIs
- **Inline comments** for complex logic
- **README updates** for new features

### API Documentation

Update the README.md with:

- **New API methods**
- **Configuration options**
- **Usage examples**
- **Breaking changes**

## Release Process

Releases are managed by maintainers:

1. **Version bump** in package.json
2. **Changelog update**
3. **Git tag creation**
4. **npm publish**
5. **GitHub release**

## Getting Help

- **GitHub Discussions** for questions
- **GitHub Issues** for bugs and features
- **Discord** (if available)

## Recognition

Contributors will be:

- **Listed in README.md**
- **Mentioned in release notes**
- **Added to CONTRIBUTORS.md**

Thank you for contributing to AI PDF Viewer! 🎉
