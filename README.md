# @wesleytodd/eslint-configless-cli

[![NPM Version](https://img.shields.io/npm/v/@wesleytodd/eslint-configless-cli.svg)](https://npmjs.org/package/@wesleytodd/eslint-configless-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/@wesleytodd/eslint-configless-cli.svg)](https://npmjs.org/package/@wesleytodd/eslint-configless-cli)
[![Build Status](https://travis-ci.org/wesleytodd/@wesleytodd/eslint-configless-cli.svg?branch=master)](https://travis-ci.org/wesleytodd/@wesleytodd/eslint-configless-cli)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/standard/standard)

Wrap eslint and a config into a standalone cli.

```
$ npm i @wesleytodd/eslint-configless-cli
```

To set your setup your cli with config just make a bin script like this:

```javascript
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
```
