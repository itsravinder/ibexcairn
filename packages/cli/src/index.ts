#!/usr/bin/env node
/**
 * ibexcairn command-line entry point.
 *
 * This is the S03 scaffold: --help and --version work; the real commands are
 * wired as their engines land (parse in S02, cost in S13). Kept deliberately
 * dependency-light so `ibexcairn --help` never touches an unimplemented stub.
 */

const VERSION = '0.0.0';

const HELP = `ibexcairn - integration migration platform (scaffold)

Usage:
  ibexcairn <command> [options]

Commands:
  parse     Parse a source project into an IR document   (arrives in S02)
  cost      Price a flow placement across candidates      (arrives in S13)

Options:
  -h, --help      Show this help
  -v, --version   Show version

See docs/10-stages.md for what is wired and what is pending.`;

export function main(argv: readonly string[]): number {
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(VERSION + '\n');
    return 0;
  }
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(HELP + '\n');
    return 0;
  }
  const command = argv[0] ?? '';
  process.stderr.write(`ibexcairn: command "${command}" is not implemented yet.\n`);
  process.stderr.write('Run "ibexcairn --help" for available commands.\n');
  return 1;
}

process.exit(main(process.argv.slice(2)));
