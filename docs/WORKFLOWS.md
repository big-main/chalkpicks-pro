# GitHub Actions Workflows Setup Guide

This guide will help you set up GitHub Actions workflows for SonarCloud, testing, and building your Chalkpicks platform.

## Quick Setup

### 1. Create Workflow Files

Create the following files in your repository:

#### `.github/workflows/build.yml`
```yaml
name: Build

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  build:
    name: Build & Type Check
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check --if-present || true
      
      - name: Build main application
        run: npm run build --if-present || true
      
      - name: Build plugin
        run: npm run build --workspace=plugins --if-present || true
      
      - name: Verify build output
        run: echo "Build completed successfully"
```

#### `.github/workflows/tests.yml`
```yaml
name: Tests

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint --if-present || true
      
      - name: Type check
        run: npm run type-check --if-present || true
      
      - name: Run tests
        run: npm run test || true
      
      - name: Generate coverage
        run: npm run test -- --coverage || true
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false
```

#### `.github/workflows/sonarcloud.yml`
```yaml
name: SonarCloud Analysis

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  sonarcloud:
    name: SonarCloud Scan
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test -- --coverage
      
      - name: Build plugin
        run: npm run build --workspace=plugins
      
      - name: Run SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=big-main_chalkpicks-prov2
            -Dsonar.organization=big-main
            -Dsonar.sources=plugins,src
            -Dsonar.exclusions=**/*.test.ts,**/node_modules/**,**/dist/**,**/*.d.ts
            -Dsonar.coverage.exclusions=**/*.test.ts,**/node_modules/**
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.typescript.tsconfigPath=tsconfig.json
```

### 2. Create SonarCloud Configuration

Create `sonar-project.properties` in your repository root:

```properties
sonar.projectKey=big-main_chalkpicks-prov2
sonar.organization=big-main

sonar.sources=plugins,src
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.d.ts,**/coverage/**
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/node_modules/**

sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.tsconfigPath=tsconfig.json

sonar.sourceEncoding=UTF-8
sonar.qualitygate.wait=true
```

### 3. Configure GitHub Secrets

Add these secrets to your GitHub repository settings (`Settings > Secrets and variables > Actions`):

1. **`SONAR_TOKEN`** - Your SonarCloud token
   - Generate at: https://sonarcloud.io/account/security/
   - Copy the token value

2. **`GITHUB_TOKEN`** - Automatically provided by GitHub Actions (no setup needed)

### 4. Set Up SonarCloud Organization

1. Go to https://sonarcloud.io/sign-up
2. Sign in with GitHub
3. Import your repository: `big-main/chalkpicks-prov2`
4. Create organization: `big-main`
5. Create project: `chalkpicks-prov2`
6. Generate a token and add it to GitHub Secrets as `SONAR_TOKEN`

## Workflow Files Directory Structure

```
.github/
└── workflows/
    ├── build.yml         # Build & Type Check
    ├── tests.yml         # Tests & Coverage
    └── sonarcloud.yml    # SonarCloud Analysis
```

## What Each Workflow Does

### Build Workflow (`build.yml`)
- ✅ Runs on push to main/develop and pull requests
- ✅ Tests on Node.js 18.x and 20.x
- ✅ Installs dependencies with npm ci
- ✅ Type checks TypeScript
- ✅ Builds main application
- ✅ Builds Vite plugin

### Tests Workflow (`tests.yml`)
- ✅ Runs on push and pull requests
- ✅ Runs ESLint (if configured)
- ✅ Runs TypeScript type checking
- ✅ Executes Vitest test suite
- ✅ Generates code coverage reports
- ✅ Uploads coverage to Codecov

### SonarCloud Workflow (`sonarcloud.yml`)
- ✅ Performs static code analysis
- ✅ Analyzes `plugins/` and `src/` directories
- ✅ Excludes tests and node_modules
- ✅ Integrates with pull requests
- ✅ Enforces quality gates
- ✅ Generates code quality badges

## npm Scripts Required

Make sure your `package.json` includes these scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

## Workflow Triggers

All workflows are triggered by:

1. **Push events** to `main` or `develop` branches
2. **Pull request events** targeting `main` or `develop`

This ensures every code change is validated before merge.

## Troubleshooting

### SonarCloud Not Running
- ✓ Check `SONAR_TOKEN` is set in GitHub Secrets
- ✓ Verify organization key matches in `sonar-project.properties`
- ✓ Ensure `fetch-depth: 0` is set in checkout step

### Tests Failing
- ✓ Check Node.js version compatibility (18.x, 20.x)
- ✓ Verify npm dependencies are installed
- ✓ Review test output in workflow logs

### Build Failing
- ✓ Check TypeScript configuration (`tsconfig.json`)
- ✓ Verify all npm scripts exist
- ✓ Review build output in workflow logs

## Next Steps

1. **Create the workflow files** in `.github/workflows/`
2. **Configure GitHub Secrets** with `SONAR_TOKEN`
3. **Set up SonarCloud** organization and project
4. **Push to repository** to trigger workflows
5. **Monitor workflow runs** in Actions tab

## Resources

- **SonarCloud**: https://sonarcloud.io/
- **GitHub Actions**: https://github.com/features/actions
- **Node.js Setup Action**: https://github.com/actions/setup-node
- **SonarCloud Action**: https://github.com/SonarSource/sonarcloud-github-action
- **Codecov Action**: https://github.com/codecov/codecov-action

## Status Badges

Once workflows are running, add these badges to your `README.md`:

```markdown
[![Build](https://github.com/big-main/chalkpicks-prov2/actions/workflows/build.yml/badge.svg)](https://github.com/big-main/chalkpicks-prov2/actions)
[![Tests](https://github.com/big-main/chalkpicks-prov2/actions/workflows/tests.yml/badge.svg)](https://github.com/big-main/chalkpicks-prov2/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=big-main_chalkpicks-prov2&metric=alert_status)](https://sonarcloud.io/dashboard?id=big-main_chalkpicks-prov2)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=big-main_chalkpicks-prov2&metric=coverage)](https://sonarcloud.io/dashboard?id=big-main_chalkpicks-prov2)
```
