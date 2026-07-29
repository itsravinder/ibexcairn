import type { RateCard } from '@ibexcairn/core-types';

/**
 * A source of rate cards. Two implementations arrive in S12 (Spec 001 step 2):
 *
 *   - LiveRateCard    - fetches from the Azure Retail Prices API and snapshots
 *   - FixtureRateCard - loads a committed snapshot from disk
 *
 * Tests must use FixtureRateCard only. A cost test that hits the network would
 * fail whenever Microsoft edits a price, which is the wrong signal and trains
 * the team to ignore the suite.
 */
export interface RateCardSource {
  load(region: string): Promise<RateCard>;
}

/** Fetches live retail rates. Implemented in S12. */
export class LiveRateCard implements RateCardSource {
  load(_region: string): Promise<RateCard> {
    return Promise.reject(new Error('LiveRateCard: not implemented until S12 (Spec 001 step 2)'));
  }
}

/** Loads a committed rate-card snapshot from disk. Implemented in S12. */
export class FixtureRateCard implements RateCardSource {
  load(_region: string): Promise<RateCard> {
    return Promise.reject(
      new Error('FixtureRateCard: not implemented until S12 (Spec 001 step 2)'),
    );
  }
}
