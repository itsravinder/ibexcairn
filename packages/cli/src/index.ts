#!/usr/bin/env node
/**
 * ibexcairn command-line entry point.
 *
 * `parse` is wired to the headless engine core (S02). `cost` arrives in S13.
 */
import { writeFileSync } from 'node:fs';
import type { Volumetrics } from '@ibexcairn/core-types';
import { parsers, ir } from '@ibexcairn/engine-core';
import { priceAll, findCrossovers } from '@ibexcairn/cost';
import { FixtureRateCard } from '@ibexcairn/rates';

const VERSION = '0.0.0';

const HELP = `ibexcairn - integration migration platform

Usage:
  ibexcairn <command> [options]

Commands:
  parse <path> [--out <file>]   Parse a source artefact into an IR document
  cost --volume <n> [options]   Price a flow across Azure candidates

Cost options:
  --volume <n>            Messages per month (required)
  --enterprise-connector  Flow uses an enterprise connector (SAP, MQ, ...)
  --stateless             Flow needs no durability / run history
  --share <n>             Workflows sharing one Standard plan (default 20)
  --region <r>            Azure region fixture (default eastus)

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

function money(v: number): string {
  if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
  if (v >= 10) return '$' + v.toFixed(0);
  return '$' + v.toFixed(2);
}

function compactVolume(m: number): string {
  if (m >= 1_000_000) return `${(m / 1_000_000).toFixed(m >= 10_000_000 ? 0 : 1)}M`;
  if (m >= 1_000) return `${Math.round(m / 1_000)}k`;
  return String(Math.round(m));
}

async function runCost(argv: readonly string[]): Promise<number> {
  const volume = Number(optionValue(argv, '--volume'));
  if (!Number.isFinite(volume) || volume <= 0) {
    process.stderr.write('cost: --volume <messages-per-month> is required.\n');
    return 1;
  }
  const enterprise = argv.includes('--enterprise-connector');
  const stateless = argv.includes('--stateless');
  const share = Number(optionValue(argv, '--share') ?? '20') || 20;
  const region = optionValue(argv, '--region') ?? 'eastus';

  let rateCard;
  try {
    rateCard = await new FixtureRateCard().load(region);
  } catch (err) {
    process.stderr.write(`cost: ${(err as Error).message}\n`);
    return 1;
  }

  const volumetrics: Volumetrics = {
    messagesPerMonth: { value: volume, provenance: 'assumed' },
    stateful: !stateless,
    workflowsPerPlan: share,
    actionsPerMessage: {
      builtIn: 12,
      standardConnector: 2,
      enterpriseConnector: enterprise ? 1 : 0,
    },
  };

  const priced = priceAll(volumetrics, rateCard);
  const recommended = priced[0];

  process.stdout.write(
    `Flow: ${volume.toLocaleString('en-US')} msgs/month, ` +
      `${enterprise ? 'enterprise connector, ' : ''}${stateless ? 'stateless' : 'stateful'}, ` +
      `share 1/${share}, region ${region}\n`,
  );
  process.stdout.write('(prices are illustrative model output from the captured rate card)\n\n');
  for (const b of priced) {
    const mark = b === recommended ? '>' : ' ';
    process.stdout.write(`  ${mark} ${b.candidate.padEnd(30)} ${money(b.monthlyCost).padStart(10)} /mo\n`);
  }
  if (recommended) {
    process.stdout.write(`\nRecommended: ${recommended.candidate} (${money(recommended.monthlyCost)}/mo)\n`);
  }

  const { crossovers } = findCrossovers(volumetrics, rateCard);
  if (crossovers.length > 0) {
    process.stdout.write('\nAcross 1k-10M msgs/month the recommendation flips at:\n');
    for (const c of crossovers) {
      process.stdout.write(`  ~${compactVolume(c.atVolume)}/mo  ${c.from} -> ${c.to}\n`);
    }
  }
  return 0;
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
    case 'cost':
      return runCost(rest);
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
