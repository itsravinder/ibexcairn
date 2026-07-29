import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RateCard } from '@ibexcairn/core-types';
import type { RateCardSource } from './source';
import { HttpRetailClient, type RetailClient } from './azureRetailClient';
import {
  assertSnapshotComplete,
  captureSnapshot,
  rateCardFromSnapshot,
  type RateSnapshot,
} from './snapshot';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LiveRateCardOptions {
  /** Override the retail client (tests inject a fake; never used in unit tests). */
  client?: RetailClient;
  /** Where captured snapshots are cached between runs. */
  cacheDir?: string;
  /** Cache lifetime before a re-fetch. Default 24h. */
  ttlMs?: number;
  /** Injectable clock. Defaults to the real clock - this is the I/O package,
   * so a real clock is fine here (unlike the pure cost package). */
  now?: () => Date;
}

/** Fetches live retail rates, with a simple on-disk TTL cache. */
export class LiveRateCard implements RateCardSource {
  private readonly client: RetailClient;
  private readonly cacheDir: string;
  private readonly ttlMs: number;
  private readonly now: () => Date;

  constructor(options: LiveRateCardOptions = {}) {
    this.client = options.client ?? new HttpRetailClient();
    this.cacheDir = options.cacheDir ?? join(process.cwd(), '.cache', 'rates');
    this.ttlMs = options.ttlMs ?? DAY_MS;
    this.now = options.now ?? ((): Date => new Date());
  }

  async load(region: string): Promise<RateCard> {
    const cached = this.readCache(region);
    const snapshot = cached ?? (await this.capture(region));
    return rateCardFromSnapshot(snapshot);
  }

  /** Fetch fresh, validate, cache, and return the snapshot. */
  async capture(region: string): Promise<RateSnapshot> {
    const snapshot = await captureSnapshot(region, this.client, this.now().toISOString());
    assertSnapshotComplete(snapshot);
    this.writeCache(region, snapshot);
    return snapshot;
  }

  private cachePath(region: string): string {
    return join(this.cacheDir, `${region}.json`);
  }

  private readCache(region: string): RateSnapshot | undefined {
    const path = this.cachePath(region);
    if (!existsSync(path)) return undefined;
    const ageMs = this.now().getTime() - statSync(path).mtimeMs;
    if (ageMs > this.ttlMs) return undefined;
    try {
      const snapshot = JSON.parse(readFileSync(path, 'utf8')) as RateSnapshot;
      assertSnapshotComplete(snapshot);
      return snapshot;
    } catch {
      return undefined;
    }
  }

  private writeCache(region: string, snapshot: RateSnapshot): void {
    mkdirSync(this.cacheDir, { recursive: true });
    writeFileSync(this.cachePath(region), JSON.stringify(snapshot, null, 2) + '\n');
  }
}
