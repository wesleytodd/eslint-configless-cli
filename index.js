import { ESLint } from 'eslint';
import { parseArgs } from 'node:util';
import { stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import loggerr from 'loggerr';

// Set log level to info to print to stdout
loggerr.setLevel('info');

export class ConfiglessESLint extends ESLint {
  constructor (opts) {
    if (!opts.overrideConfig) {
      throw new TypeError('overrideConfig required');
    }
    super({
      ...opts,
      overrideConfigFile: true,
      overrideConfig: opts.overrideConfig
    });
  }
}

// Coppied from https://github.com/eslint/eslint/blob/main/lib/cli.js#L87C1-L96C2
async function isDirectory (filePath) {
  try {
    return (await stat(filePath)).isDirectory();
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      return false;
    }
    throw error;
  }
}

// Coppied from https://github.com/eslint/eslint/blob/main/lib/cli.js#L108C1-L143C2
async function printResults (engine, results, format, outputFile, resultsMeta) {
  let formatter;

  try {
    formatter = await engine.loadFormatter(format);
  } catch (e) {
    loggerr.error(e);
    return false;
  }

  const output = await formatter.format(results, resultsMeta);

  if (outputFile) {
    const filePath = path.resolve(process.cwd(), outputFile);

    if (await isDirectory(filePath)) {
      loggerr.error(new Error(`Cannot write to output file path, it is a directory: ${outputFile}`));
      return false;
    }

    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, output);
    } catch (e) {
      loggerr.error(e);
      return false;
    }
  } else if (output) {
    loggerr.writeLevel('info', output);
  }

  return true;
}

// Coppied from https://github.com/eslint/eslint/blob/main/bin/eslint.js#L47C1-L62C2
async function readStdin () {
  return new Promise((resolve, reject) => {
    let content = '';
    let chunk = '';

    process.stdin
      .setEncoding('utf8')
      .on('readable', () => {
        while ((chunk = process.stdin.read()) !== null) {
          content += chunk;
        }
      })
      .on('end', () => resolve(content))
      .on('error', reject);
  });
}

export function cli (config) {
  const options = {
    fix: {
      type: 'boolean'
    },
    'fix-dry-run': {
      type: 'boolean'
    },
    'fix-type': {
      type: 'string',
      multiple: true
    },

    stdin: {
      type: 'boolean'
    },
    'stdin-filename': {
      type: 'string'
    },

    quiet: {
      type: 'boolean'
    },
    'output-file': {
      type: 'string',
      short: 'o'
    },
    format: {
      type: 'string',
      short: 'f'
    },
    color: {
      type: 'boolean'
    },

    cache: {
      type: 'boolean'
    },
    'cache-location': {
      type: 'string'
    },
    'cache-strategy': {
      type: 'string'
    },

    init: {
      type: 'boolean'
    },

    'exit-on-fatal-error': {
      type: 'boolean'
    },

    debug: {
      type: 'boolean'
    },

    help: {
      type: 'boolean'
    },

    version: {
      type: 'boolean'
    },

    'print-config': {
      type: 'boolean'
    },

    concurrency: {
      type: 'string'
    }
  };


  return async (args) => {
    const { values, positionals } = parseArgs({
      args,
      options,
      allowNegative: true,
      allowPositionals: true
    });

    if (values.help) {
      throw new Error('--help not yet implemented');
    }

    if (values.version) {
      throw new Error('--version not yet implemented');
    }

    if (values['print-config']) {
      throw new Error('--print-config not yet implemented');
    }

    if (values.init) {
      throw new Error('--init not yet implemented');
    }

    if (values.fix && values['fix-dry-run']) {
      throw new Error('The --fix option and the --fix-dry-run option cannot be used together.');
    }

    if (values.fix && values.stdin) {
      throw new Error('The --fix option is not available for piped-in code; use --fix-dry-run instead.');
    }

    if (values['fix-type'] && !values.fix && !values['fix-dry-run']) {
      throw new Error('The --fix-type option requires either --fix or --fix-dry-run.');
    }

    const lint = new ConfiglessESLint({
      ...config,
      fix: values.fix || values['fix-dry-run']
    });

    let results;
    if (values.stdin) {
      results = await lint.lintText(await readStdin(), {
        filePath: values['stdin-filename'],
      });
    } else {
      results = await lint.lintFiles(positionals);
    }

    if (values.fix) {
      await ConfiglessESLint.outputFixes(results);
    }

    let resultsToPrint = results;
    if (values.quiet) {
      resultsToPrint = ConfiglessESLint.getErrorResults(resultsToPrint);
    }

    await printResults(lint, resultsToPrint, values.format, values['output-file'], {
      color: values.color
    });

    return results;
  };
}
