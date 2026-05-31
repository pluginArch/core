import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = resolve(__dirname, 'policy-check.mjs');

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function createWorkspaceFixture(overrides?: {
  tsconfigBase?: Record<string, unknown>;
}) {
  const rootDir = await mkdtemp(join(tmpdir(), 'policy-check-'));

  await mkdir(join(rootDir, 'apps/main'), { recursive: true });
  await mkdir(join(rootDir, 'packages/core-ui'), { recursive: true });

  await writeJson(join(rootDir, 'package.json'), {
    name: '@pluginarch/source',
    private: true,
    workspaces: ['packages/*', 'apps/*'],
  });

  await writeJson(
    join(rootDir, 'tsconfig.base.json'),
    overrides?.tsconfigBase ?? {
      compilerOptions: {
        customConditions: ['@pluginarch/source'],
      },
    },
  );

  await writeJson(join(rootDir, 'apps/main/package.json'), {
    name: '@pluginarch/main',
    private: true,
  });

  await writeFile(
    join(rootDir, 'apps/main/vite.config.mts'),
    `export default {
  resolve: {
    conditions: ['@pluginarch/source', 'module', 'browser', 'development|production'],
  },
};
`,
    'utf8',
  );

  await writeJson(join(rootDir, 'packages/core-ui/package.json'), {
    name: '@pluginarch/core-ui',
    exports: {
      '.': {
        '@pluginarch/source': './src/index.ts',
        import: './dist/index.js',
        default: './dist/index.js',
      },
      './styles': {
        '@pluginarch/source': './src/lib/core-ui.css',
        default: './dist/index.css',
      },
    },
  });

  return rootDir;
}

describe('policy-check script', () => {
  it('passes for a valid workspace fixture', async () => {
    const fixtureRoot = await createWorkspaceFixture();

    try {
      const result = spawnSync(process.execPath, [SCRIPT_PATH], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Workspace policy checks passed.');
      expect(result.stderr).toBe('');
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('fails when root custom condition is missing', async () => {
    const fixtureRoot = await createWorkspaceFixture({
      tsconfigBase: {
        compilerOptions: {
          customConditions: [],
        },
      },
    });

    try {
      const result = spawnSync(process.execPath, [SCRIPT_PATH], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'tsconfig.base.json compilerOptions.customConditions must include @pluginarch/source.',
      );
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });

  it('fails when styles source condition mapping is missing', async () => {
    const fixtureRoot = await createWorkspaceFixture();

    await writeJson(join(fixtureRoot, 'packages/core-ui/package.json'), {
      name: '@pluginarch/core-ui',
      exports: {
        '.': {
          '@pluginarch/source': './src/index.ts',
          import: './dist/index.js',
          default: './dist/index.js',
        },
        './styles': {
          default: './dist/index.css',
        },
      },
    });

    try {
      const result = spawnSync(process.execPath, [SCRIPT_PATH], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'packages/core-ui/package.json exports["./styles"] must map @pluginarch/source to ./src/lib/core-ui.css.',
      );
    } finally {
      await rm(fixtureRoot, { recursive: true, force: true });
    }
  });
});
