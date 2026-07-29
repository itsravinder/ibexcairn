import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RateCard } from '@ibexcairn/core-types';
import type { RateCardSource } from './source';
import { assertSnapshotComplete, rateCardFromSnapshot, type RateSnapshot } from './snapshot';

/** Committed fixtures live at packages/rates/fixtures (dist is one level down). */
const DEFAULT_FIXTURES_DIR = join(__dirname, '..', 'fixtures');

/** Loads a committed rate-card snapshot from disk. No network. */
export class FixtureRateCard implements RateCardSource {
  constructor(private readonly fixturesDir: string = DEFAULT_FIXTURES_DIR) {}

  load(region: string): Promise<RateCard> {
    // Sync work behind the async interface. Wrapped so a read or validation
    // failure surfaces as a rejection (what callers and tests expect), not a
    // synchronous throw.
    return Promise.resolve().then(() => {
      const path = join(this.fixturesDir, `${region}.json`);
      let raw: string;
      try {
        raw = readFileSync(path, 'utf8');
      } catch (err) {
        throw new Error(
          `No rate fixture for region '${region}' at ${path}: ${(err as Error).message}`,
        );
      }
      const snapshot = JSON.parse(raw) as RateSnapshot;
      assertSnapshotComplete(snapshot);
      return rateCardFromSnapshot(snapshot);
    });
  }
}
