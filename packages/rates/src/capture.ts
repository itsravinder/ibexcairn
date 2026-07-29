#!/usr/bin/env node
/**
 * Regenerate a committed rate-card fixture from the live Azure Retail Prices
 * API. Run with:  pnpm rates:capture [region]   (default region: eastus)
 *
 * This is the only way a fixture is produced - fixtures are real captures, not
 * hand-typed. Tests never run this (it touches the network); it is a developer
 * tool for refreshing the snapshot when prices or meters change.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpRetailClient } from './azureRetailClient';
import { assertSnapshotComplete, captureSnapshot } from './snapshot';

async function main(): Promise<void> {
  const region = process.argv[2] ?? 'eastus';
  const client = new HttpRetailClient();
  const snapshot = await captureSnapshot(region, client, new Date().toISOString());
  assertSnapshotComplete(snapshot);

  const dir = join(__dirname, '..', 'fixtures');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${region}.json`);
  writeFileSync(path, JSON.stringify(snapshot, null, 2) + '\n');

  console.log(`Wrote ${path} (retrieved ${snapshot.retrievedOn})`);
  for (const [key, rate] of Object.entries(snapshot.rates)) {
    console.log(`  ${key.padEnd(48)} ${rate.value}  (${rate.canonicalUnit})`);
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
