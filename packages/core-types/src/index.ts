/**
 * Shared type contracts for the cost engine.
 *
 * Types only: this package contains no logic and no I/O. The behaviour that
 * fills these shapes arrives in S12 (rate card) and S13 (cost model). Keeping
 * the contracts here lets `cost` stay pure and lets `rates` and `cli` compile
 * against a stable surface. See docs/specs/001-cost-engine.md.
 */

/** Where a volumetric figure came from. Code cannot reveal traffic, so every
 * number is tagged. A total built on silent assumptions is worse than none -
 * see docs/03-placement-cost-engine.md and ADR-0004. */
export type Provenance = 'measured' | 'assumed';

export const PROVENANCE_VALUES = ['measured', 'assumed'] as const;

/** A single input value together with its provenance. */
export interface VolumetricValue {
  readonly value: number;
  readonly provenance: Provenance;
}

/** Traffic profile for one flow. Populated by the harvester (S09) or the UI. */
export interface Volumetrics {
  readonly messagesPerMonth: VolumetricValue;
  readonly avgMessageSizeBytes?: VolumetricValue;
  readonly p95MessageSizeBytes?: VolumetricValue;
  readonly peakFactor?: VolumetricValue;
  /** Actions executed per message, by connector class. */
  readonly actionsPerMessage?: {
    readonly builtIn: number;
    readonly standardConnector: number;
    readonly enterpriseConnector: number;
  };
  /** Stateful workflows incur storage transactions; stateless do not. */
  readonly stateful?: boolean;
  /** Workflows sharing one Standard plan, for bin-packing (S15). */
  readonly workflowsPerPlan?: number;
}

/** Candidate Azure compositions the cost engine prices (S13). More are added
 * as emitters land; this is not the closed set of Azure targets. */
export type CandidateId =
  | 'logicapps-consumption'
  | 'logicapps-standard-dedicated'
  | 'logicapps-standard-shared'
  | 'function-servicebus';

/** A chosen or candidate placement. Extended later by the S06 targetPlan
 * layer and the S11 archetype classifier. */
export interface Placement {
  readonly candidate: CandidateId;
  readonly region: string;
}

/** A resolved rate card for one region. Produced by S12 from the Azure Retail
 * Prices API. `retrievedOn` is injected, never read from the clock, so the
 * cost engine stays a pure function of its arguments. */
export interface RateCard {
  readonly region: string;
  readonly retrievedOn: string;
  /** Monthly-normalised rate for a meter id. Throws if the meter is unknown -
   * a missing meter priced as free is the most dangerous failure mode (S12). */
  meterRate(meterId: string): number;
}

/** One line of a cost breakdown, traceable to a meter and an input. */
export interface CostLineItem {
  readonly label: string;
  readonly meterId: string;
  readonly quantity: number;
  readonly unitRate: number;
  readonly monthlyCost: number;
  readonly provenance: Provenance;
}

/** The result of cost(): a total plus provenance-carrying line items. A total
 * without provenance is unusable in front of a CFO - see ADR-0004. */
export interface CostBreakdown {
  readonly candidate: CandidateId;
  readonly monthlyCost: number;
  readonly lineItems: readonly CostLineItem[];
}
