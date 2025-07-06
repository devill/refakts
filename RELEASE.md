# Release Process

## Manual Release Steps

1. **Version Bump**: Update version in `package.json`
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features  
   npm version major  # for breaking changes
   ```

2. **Create and Push Tag**: The `npm version` command automatically creates a git tag
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions**: The release workflow automatically triggers when a tag is pushed
   - Runs tests and builds the package
   - Publishes to npm registry
   - Creates GitHub release

## Automated Release (GitHub Actions)

The release process is fully automated via GitHub Actions when you push a tag starting with `v`:

### Prerequisites
- `NPM_TOKEN` secret set in GitHub repository settings
- `GITHUB_TOKEN` automatically provided by GitHub Actions

### Workflow
1. **CI/CD Pipeline** (`ci.yml`): Runs on every push and PR
   - Tests on Node.js 18.x and 20.x
   - Runs linter and tests
   - Builds package
   - Tests CLI functionality

2. **Release Pipeline** (`release.yml`): Runs on tag push
   - Builds and tests the package
   - Publishes to npm registry
   - Creates GitHub release

## Local Testing

Before releasing, test the package locally:

```bash
# Run tests
npm test

# Build the package
npm run build

# Test CLI functionality
node dist/cli.js --help

# Test packaging (dry run)
npm pack --dry-run

# Test local installation
npm pack
npm install -g refakts-1.0.0.tgz
refakts --help
npm uninstall -g refakts
```

## First Release Setup

1. **Create npm account**: https://www.npmjs.com/signup
2. **Generate npm token**: https://www.npmjs.com/settings/tokens
3. **Add token to GitHub**: Repository Settings → Secrets → `NPM_TOKEN`
4. **Verify package name availability**: `npm search refakts`

## Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version bumped appropriately
- [ ] Tag created and pushed
- [ ] GitHub Actions completed successfully
- [ ] Package published to npm
- [ ] GitHub release created
- [ ] Test installation from npm registry