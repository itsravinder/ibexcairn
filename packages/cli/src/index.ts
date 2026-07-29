#!/usr/bin/env node
/**
 * ibexcairn command-line entry point.
 *
 * `parse` is wired to the headless engine core (S02). `cost` arrives in S13.
 */
import { writeFileSync } from 'node:fs';
import { parsers, ir } from '@ibexcairn/engine-core';

const VERSION = '0.0.0';

const HELP = `ibexcairn - integration migration platform

Usage:
  ibexcairn <command> [options]

Commands:
  parse <path> [--out <file>]   Parse a source artefact into an IR document
  cost                          Price a flow placement across candidates (S13)

Options:
  -h, --help      Show this help
  -v, --version   Show version`;

function nonFlagArg(argv: readonly string[]): string | undefined {
  return argv.find((a) => !a.startsWith('-'));
}

function optionValue(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
}

async function runParse(argv: readonly string[]): Promise<number> {
  const path = nonFlagArg(argv);
  if (!path) {
    process.stderr.write('parse: give a file or folder path.\n');
    return 1;
  }

  parsers.initializeParsers();
  const parser = parsers.defaultParserRegistry.findForPath(path);
  if (!parser) {
    process.stderr.write(`parse: no parser recognises "${path}".\n`);
    return 1;
  }

  const result = await parser.parse(path);
  if (!result.success || !result.ir) {
    process.stderr.write(`parse: failed with ${result.errors.length} error(s).\n`);
    for (const err of result.errors.slice(0, 10)) {
      process.stderr.write(`  - ${err.message ?? 'unknown parse error'}\n`);
    }
    return 1;
  }

  const document = result.ir;
  const valid = ir.isValidIR(document);
  const json = JSON.stringify(document, null, 2);
  const out = optionValue(argv, '--out');
  if (out) {
    writeFileSync(out, json + '\n');
    process.stderr.write(
      `parse: wrote ${out} - ${document.schemas.length} schema(s), ` +
        `${document.actions.length} action(s), valid=${String(valid)}.\n`,
    );
  } else {
    process.stdout.write(json + '\n');
  }
  return valid ? 0 : 2;
}

async function main(argv: readonly string[]): Promise<number> {
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(VERSION + '\n');
    return 0;
  }
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(HELP + '\n');
    return 0;
  }
  const command = argv[0] ?? '';
  const rest = argv.slice(1);
  switch (command) {
    case 'parse':
      return runParse(rest);
    default:
      process.stderr.write(`ibexcairn: unknown command "${command}". Try --help.\n`);
      return 1;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    process.stderr.write(`ibexcairn: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
