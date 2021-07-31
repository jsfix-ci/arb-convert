#!/usr/bin/env node

import commander from 'commander';
import fs from 'fs';
import { parseToArb } from '../index';

const program = new commander.Command();
program
  .name('xliff2arb')
  .option('--file <filename>', 'source XLIFF file (required)')
  .option('--sourceout <filename>', 'write source ARB to file if given or stdout if omitted')
  .option('--targetout <filename>', 'write target ARB to file if given')
  .parse(process.argv);

// No params
if (process.argv.length <= 2) {
  program.help(); // shows help and exits
}

try {
  const options = program.opts();

  if (!options.file) {
    throw new Error("option '--file <filename>' is required");
  }

  const fileContent = fs.readFileSync(options.file, 'utf8');
  const result = parseToArb('xliff', {
    content: fileContent,
  });

  if (options.sourceout) {
    fs.writeFileSync(options.sourceout, result.source);
  } else {
    process.stdout.write(result.source);
  }

  if (options.targetout) {
    fs.writeFileSync(options.targetout, result.target!);
  }
} catch (error) {
  process.stdout.write(`error: ${error.message}`);
  process.exit(1);
}
