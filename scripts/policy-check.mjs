#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const SOURCE_CONDITION = '@pluginarch/source';

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

async function readJson(filePath) {
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function getWorkspacePackageJsonPaths(rootDir, workspaces) {
  const result = [];

  for (const workspacePattern of workspaces) {
    if (!workspacePattern.endsWith('/*')) {
      continue;
    }

    const workspaceDir = path.join(rootDir, workspacePattern.slice(0, -2));
    let entries;
    try {
      entries = await readdir(workspaceDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const packageJsonPath = path.join(
        workspaceDir,
        entry.name,
        'package.json',
      );
      try {
        const packageJsonStat = await stat(packageJsonPath);
        if (packageJsonStat.isFile()) {
          result.push(packageJsonPath);
        }
      } catch {
        // Ignore non-package directories.
      }
    }
  }

  return result;
}

function checkNoPerProjectVersionPins(packageJsonPath, packageJson) {
  const relPath = path.relative(process.cwd(), packageJsonPath);
  const hasDependencies =
    packageJson.dependencies &&
    Object.keys(packageJson.dependencies).length > 0;
  const hasDevDependencies =
    packageJson.devDependencies &&
    Object.keys(packageJson.devDependencies).length > 0;

  if (hasDependencies || hasDevDependencies) {
    fail(
      `${relPath} must not declare dependencies/devDependencies (single-version policy uses root package.json).`,
    );
  }
}

function checkSourceConditionInTsConfig(tsconfigBase) {
  const customConditions = tsconfigBase?.compilerOptions?.customConditions;
  if (
    !Array.isArray(customConditions) ||
    !customConditions.includes(SOURCE_CONDITION)
  ) {
    fail(
      `tsconfig.base.json compilerOptions.customConditions must include ${SOURCE_CONDITION}.`,
    );
  }
}

function checkCoreUiExports(coreUiPackageJson) {
  const exportsMap = coreUiPackageJson.exports;
  const rootExport = exportsMap?.['.'];
  const stylesExport = exportsMap?.['./styles'];

  if (!rootExport || rootExport[SOURCE_CONDITION] !== './src/index.ts') {
    fail(
      `packages/core-ui/package.json exports["."] must map ${SOURCE_CONDITION} to ./src/index.ts.`,
    );
  }

  if (
    rootExport.import !== './dist/index.js' ||
    rootExport.default !== './dist/index.js'
  ) {
    fail(
      'packages/core-ui/package.json exports["."] import/default must map to ./dist/index.js.',
    );
  }

  if (!stylesExport || stylesExport.default !== './dist/index.css') {
    fail(
      'packages/core-ui/package.json exports["./styles"] default must map to ./dist/index.css.',
    );
  }

  if (stylesExport[SOURCE_CONDITION] !== './src/lib/core-ui.css') {
    fail(
      `packages/core-ui/package.json exports["./styles"] must map ${SOURCE_CONDITION} to ./src/lib/core-ui.css.`,
    );
  }
}

async function checkMainViteConditions(rootDir) {
  const viteConfigPath = path.join(rootDir, 'apps/main/vite.config.mts');
  const viteConfig = await readFile(viteConfigPath, 'utf8');
  const required = [
    `'${SOURCE_CONDITION}'`,
    "'module'",
    "'browser'",
    "'development|production'",
  ];

  for (const token of required) {
    if (!viteConfig.includes(token)) {
      fail(`apps/main/vite.config.mts resolve.conditions is missing ${token}.`);
    }
  }
}

async function main() {
  const rootDir = process.cwd();
  const rootPackageJsonPath = path.join(rootDir, 'package.json');
  const rootPackageJson = await readJson(rootPackageJsonPath);
  const tsconfigBase = await readJson(path.join(rootDir, 'tsconfig.base.json'));
  const coreUiPackageJson = await readJson(
    path.join(rootDir, 'packages/core-ui/package.json'),
  );

  checkSourceConditionInTsConfig(tsconfigBase);
  checkCoreUiExports(coreUiPackageJson);
  await checkMainViteConditions(rootDir);

  const workspaces = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : [];
  const workspacePackageJsonPaths = await getWorkspacePackageJsonPaths(
    rootDir,
    workspaces,
  );

  for (const packageJsonPath of workspacePackageJsonPaths) {
    const packageJson = await readJson(packageJsonPath);
    checkNoPerProjectVersionPins(packageJsonPath, packageJson);
  }

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }

  console.log('Workspace policy checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
