import { suite, test, beforeEach } from 'mocha';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import { ConfiglessESLint, cli } from '../index.js';

const TMP_DIR = path.join(import.meta.dirname, 'tmp');
const FIX_DIR = path.join(import.meta.dirname, 'fixtures');

suite('ConfiglessESLint', () => {
  beforeEach(async () => {
    try {
      await fs.rm(TMP_DIR, {
        recursive: true
      });
    } catch {
      // ignore error
    }
    await fs.mkdir(TMP_DIR);
  });

  test('requires overrideConfig', async () => {
    assert.throws(() => new ConfiglessESLint());
  });

  test('correctly sets overrideConfig', async () => {
    const lint = new ConfiglessESLint({
      overrideConfig: {
        files: ['**/*.js'],
        rules: {
          'no-console': ['error']
        }
      },
    });
    assert(lint);
    assert(lint.lintFiles);
    assert(lint.lintText);

    const results = await lint.lintText('console.log("hello world!")', {
      filePath: 'test.js'
    });
    assert.equal(results[0].messages.length, 1);
  });

  test('cretes a cli', async () => {
    const main = cli({
      overrideConfig: {
        rules: {
          'capitalized-comments': ['error', 'always']
        }
      },
    });

    const results = await main(['--fix-dry-run', import.meta.filename]);
    assert(results[0].output.includes('// Here is my comment'));
  });

  test('cli writes results to file', async () => {
    const main = cli({
      overrideConfig: {
        rules: {
          'capitalized-comments': ['error', 'always']
        }
      },
    });

    const outFile = path.join(TMP_DIR, 'results.txt');
    await main(['--no-color', `--output-file=${outFile}`, path.join(FIX_DIR, 'file.js')]);

    const file = await fs.readFile(outFile, 'utf8');
    assert(file.includes('capitalized-comments'));
  });

  test('cli writes fixed to disk', async () => {
    const main = cli({
      overrideConfig: {
        rules: {
          'capitalized-comments': ['error', 'always']
        }
      }
    });

    const outFile = path.join(TMP_DIR, 'results.txt');
    const fixFile = path.join(FIX_DIR, 'file.js');
    const lintFile = path.join(TMP_DIR, 'file.js');
    await fs.copyFile(fixFile, lintFile);

    await main(['--no-color', `--output-file=${outFile}`, '--fix', lintFile]);

    const results = await fs.readFile(outFile, 'utf8');
    assert(!results.includes('capitalized-comments'));

    const file = await fs.readFile(lintFile, 'utf8');
    assert(file.includes('// Here is my comment'));
  });
});
