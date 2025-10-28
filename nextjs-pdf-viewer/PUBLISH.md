# Publishing to npm

## Prerequisites

1. **Create an npm account** (if you don't have one):

   - Go to https://www.npmjs.com/signup
   - Sign up with your email

2. **Login to npm via command line**:
   ```bash
   npm login
   ```
   Enter your username, password, and email when prompted.

## Pre-Publishing Checklist

- [x] Package name is available (`nextjs-pdf-viewer`)
- [x] Build is successful (`npm run build`)
- [x] All files in the `dist` folder are generated
- [ ] TypeScript types are properly exported
- [ ] License is specified (MIT ✓)
- [ ] Repository URL is correct
- [ ] README is comprehensive

## Publishing Steps

### 1. Verify you're logged in

```bash
npm whoami
```

### 2. Ensure the build is up to date

```bash
npm run build
npm run typecheck
```

### 3. Preview what will be published

```bash
npm pack --dry-run
```

This shows the exact files that will be included in the tarball.

### 4. Publish to npm

**For the first release:**

```bash
npm publish
```

**For subsequent releases:**
Update the version in `package.json` first:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

Then publish:

```bash
npm publish
```

### 5. Verify the publication

```bash
npm view nextjs-pdf-viewer
```

Visit: https://www.npmjs.com/package/nextjs-pdf-viewer

## Publishing Options

### Publish as Private Package

```bash
npm publish --access restricted
```

Note: You need a paid npm account for private packages.

### Publish to a Different Registry

```bash
npm publish --registry https://your-registry.com
```

### Tag the Release

```bash
# Publish with a specific tag (not latest)
npm publish --tag beta
npm publish --tag next
```

### Scoped Package (Optional)

If you want to publish as a scoped package (e.g., `@yourusername/nextjs-pdf-viewer`):

1. Update `package.json`: `"name": "@yourusername/nextjs-pdf-viewer"`
2. Publish with: `npm publish --access public`

## Post-Publishing

1. **Test the installation**:

   ```bash
   cd /tmp
   mkdir test-pdf-viewer
   cd test-pdf-viewer
   npm init -y
   npm install nextjs-pdf-viewer
   ```

2. **Update the demo project** (if needed):
   Update the demo's `package.json` to use the published version instead of `file:../nextjs-pdf-viewer`

3. **Announce the release**:
   - Update GitHub repository
   - Create a release tag: `git tag v0.1.0 && git push origin v0.1.0`
   - Update your README badges if needed

## Troubleshooting

### "You do not have permission to publish"

- Check if you're logged in: `npm whoami`
- Log in again: `npm login`

### "Package name already exists"

- Choose a different unique name
- Consider using a scoped package name

### "Missing required fields"

- Ensure `name`, `version`, and `main` are set in `package.json`

### "npm ERR! code ENEEDAUTH"

- Run `npm login` to authenticate

## Version Management

Semantic Versioning (SemVer):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backward compatible
- **PATCH** (1.1.1): Bug fixes, backward compatible

Current version: 0.1.0

## Updating Your Package

After making changes:

1. Make your changes
2. Test thoroughly
3. Update version: `npm version patch|minor|major`
4. Build: `npm run build`
5. Commit and tag: `git commit -am "v0.1.1" && git tag v0.1.y && git push && git push --tags`
6. Publish: `npm publish`
