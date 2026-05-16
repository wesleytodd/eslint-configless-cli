#! /usr/bin/env node

import { cli } from '../index.js';
import process from 'node:process';
import js from '@eslint/js';

await cli({
  overrideConfig: {
    ...js.configs.recommended,
    plugins: { js }
  }
})(process.argv.slice(1));
