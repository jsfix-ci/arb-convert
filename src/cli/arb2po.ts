#!/usr/bin/env node

import commander from 'commander';
import fs from 'fs';
import { convertFromArb } from '../index';
import parseLocale from '../util/parseLocale';

const program = new commander.Command();
program
  .name('arb2po')
  .option('--sourcefile <filename>', 'source ARB file (required)')
  .option('--targetfile <filename>', 'target ARB file')
  .option('--original <value>', 'where the translations come from')
  .option('--sourcelang <locale>', 'source locale override, e.g. en-US, in case it cannot be determined from file content or file name')
  .option('--targetlang <locale>', 'target locale override, e.g. de-DE, in case it cannot be determined from file content or file name')
  .option('--out <filename>', 'write PO to file if given or stdout if omitted')
  .parse(process.argv);

// No params
if (process.argv.length <= 2) {
  program.help(); // shows help and exits
}

try {
  const options = program.opts();

  if (!options.sourcefile) {
    throw new Error("option '--sourcefile <filename>' is required");
  }

  const sourceContent = fs.readFileSync(options.sourcefile, 'utf8');
  const targetContent = options.targetfile && fs.readFileSync(options.targetfile, 'utf8');
  const result = convertFromArb('gettext', {
    source: sourceContent,
    target: targetContent,
    original: options.original,
    sourceLanguage: parseLocale(
      options.sourcelang,
      determineArbLocale(sourceContent),
      options.sourcefile,
    ),
    targetLanguage: options.targetfile && parseLocale(
      options.targetlang,
      determineArbLocale(targetContent),
      options.targetfile,
    ),
  });

  if (options.out) {
    fs.writeFileSync(options.out, result.content);
  } else {
    process.stdout.write(result.content);
  }
} catch (error) {
  process.stdout.write(`error: ${error.message}`);
  process.exit(1);
}

function determineArbLocale(content: string) {
  const matches = content.match(/"@@locale":\s*"(.+)"/);

  if (matches) {
    return matches[1];
  }

  return '';
}
