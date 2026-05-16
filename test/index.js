import { suite, test } from 'mocha';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import { ConfiglessESLint, cli } from '../index.js';

// NOTE: this comment is used in the tests, keep must start with a lowercase letter
// here is my comment

suite('ConfiglessESLint', () => {
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

    const outFile = path.join(import.meta.dirname, 'results.txt');
    await main(['--no-color', `--output-file=${outFile}`, import.meta.filename]);

    const file = await fs.readFile(outFile, 'utf8');
    assert(file.includes('capitalized-comments'));
    await fs.rm(outFile);
  });
});
