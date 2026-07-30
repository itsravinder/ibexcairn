import type {
  CandidateId,
  CostBreakdown,
  Placement,
  RateCard,
  Volumetrics,
} from '@ibexcairn/core-types';
import { ALL_CANDIDATES, candidateLines } from './candidates';
import { messagesPerMonth, resolveParams } from './model';

export { DEFAULT_MODEL_PARAMS, resolveParams, type CostModelParams } from './model';
export { ALL_CANDIDATES } from './candidates';

/**
 * Price one placement for one flow at its volume.
 *
 * Pure: no I/O, no clock, no randomness. Rates come from the rate card; the
 * language model never produces a figure here (ADR-0004). The breakdown carries
 * per-line meter ids and provenance, because a total without provenance is
 * unusable in front of a CFO.
 */
export function cost(
  placement: Placement,
  volumetrics: Volumetrics,
  rateCard: RateCard,
): CostBreakdown {
  const params = resolveParams(volumetrics);
  const m = messagesPerMonth(volumetrics);
  const provenance = volumetrics.messagesPerMonth.provenance;
  const lineItems = candidateLines(placement.candidate, m, params, rateCard, provenance);
  const monthlyCost = lineItems.reduce((sum, li) => sum + li.monthlyCost, 0);
  return { candidate: placement.candidate, monthlyCost, lineItems };
}

/** Price every candidate for a flow, cheapest first. */
export function priceAll(volumetrics: Volumetrics, rateCard: RateCard): CostBreakdown[] {
  const region = rateCard.region;
  return ALL_CANDIDATES.map((candidate) =>
    cost({ candidate, region }, volumetrics, rateCard),
  ).sort((a, b) => a.monthlyCost - b.monthlyCost);
}

/** The cheapest candidate for a flow. */
export function cheapest(volumetrics: Volumetrics, rateCard: RateCard): CostBreakdown {
  const [best] = priceAll(volumetrics, rateCard);
  if (!best) throw new Error('cost: no candidates priced');
  return best;
}

export interface Crossover {
  /** Volume (messages/month) at which the cheapest candidate changes. */
  readonly atVolume: number;
  readonly from: CandidateId;
  readonly to: CandidateId;
}

export interface CrossoverScan {
  readonly range: { readonly min: number; readonly max: number; readonly samples: number };
  readonly crossovers: readonly Crossover[];
}

/** Replace a flow's volume, keeping every other characteristic. */
function atVolume(volumetrics: Volumetrics, value: number): Volumetrics {
  return {
    ...volumetrics,
    messagesPerMonth: { value, provenance: volumetrics.messagesPerMonth.provenance },
  };
}

/**
 * Scan log-spaced volumes and record every point where the cheapest candidate
 * changes. Reports the sampled bracket (no interpolation), so the caller sees
 * exactly where the recommendation flips.
 */
export function findCrossovers(
  volumetrics: Volumetrics,
  rateCard: RateCard,
  range: { min: number; max: number; samples: number } = { min: 1_000, max: 10_000_000, samples: 200 },
): CrossoverScan {
  const crossovers: Crossover[] = [];
  const logMin = Math.log10(range.min);
  const logMax = Math.log10(range.max);
  let previous: CandidateId | undefined;

  for (let i = 0; i <= range.samples; i += 1) {
    const m = Math.pow(10, logMin + ((logMax - logMin) * i) / range.samples);
    const best = cheapest(atVolume(volumetrics, m), rateCard);
    if (previous && best.candidate !== previous) {
      crossovers.push({ atVolume: m, from: previous, to: best.candidate });
    }
    previous = best.candidate;
  }
  return { range, crossovers };
}
