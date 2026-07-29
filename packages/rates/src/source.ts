import type { RateCard } from '@ibexcairn/core-types';

/**
 * A source of rate cards. Two implementations:
 *   - FixtureRateCard - loads a committed snapshot from disk (used by tests)
 *   - LiveRateCard    - fetches from the Azure Retail Prices API and caches
 *
 * Tests must use FixtureRateCard only. A cost test that reached the network
 * would fail whenever Microsoft edited a price - the wrong signal, and it
 * trains the team to ignore the suite.
 */
export interface RateCardSource {
  load(region: string): Promise<RateCard>;
}
