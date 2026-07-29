import type { CostBreakdown, Placement, RateCard, Volumetrics } from '@ibexcairn/core-types';

/**
 * Price one placement for one flow at a given volume.
 *
 * This function MUST stay pure: no file system, no network, no `Date.now()`,
 * no `Math.random()`. Rates and volumetrics arrive as arguments. That is what
 * makes cost reproducible and what lets its acceptance tests pin exact
 * numbers. The language model never produces a figure here - see ADR-0004.
 *
 * Implemented in S13 (Spec 001 step 3), where the five billing rules and the
 * crossover detector land, each with its own fixture.
 */
export function cost(
  _placement: Placement,
  _volumetrics: Volumetrics,
  _rateCard: RateCard,
): CostBreakdown {
  throw new Error('cost(): not implemented until S13 (Spec 001 step 3)');
}
