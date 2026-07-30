import type { Volumetrics } from '@ibexcairn/core-types';

/**
 * Per-message model parameters. These are engineering assumptions about how a
 * flow behaves (executions, operations, transactions per message) - NOT prices.
 * Prices come only from the rate card. Every value here is tunable by the
 * customer, exactly like the interactive calculator in the dossier. Keeping
 * them explicit is what keeps the model honest (see ADR-0004).
 */
export interface CostModelParams {
  readonly builtInActionsPerMessage: number;
  readonly standardConnectorActionsPerMessage: number;
  readonly enterpriseConnectorActionsPerMessage: number;
  /** Function executions per message (usually 1). */
  readonly fnExecutionsPerMessage: number;
  /** Function compute per message, in GB-seconds. */
  readonly fnGbSecondsPerMessage: number;
  /** Service Bus operations per message (e.g. enqueue + dequeue = 2). */
  readonly serviceBusOpsPerMessage: number;
  /** Storage transactions per message for a stateful workflow. */
  readonly storageTransactionsPerMessage: number;
  /** Messages/month above which a shared plan is treated as a dedicated one. */
  readonly sharedPlanCapacityPerMonth: number;
  /** Workflows sharing one Standard plan (bin-packing divisor). */
  readonly workflowsPerPlan: number;
  readonly stateful: boolean;
}

/** Defaults for the reference flow used throughout the design docs:
 * 12 built-in + 2 standard-connector actions, stateful, 20 to a plan. */
export const DEFAULT_MODEL_PARAMS: CostModelParams = {
  builtInActionsPerMessage: 12,
  standardConnectorActionsPerMessage: 2,
  enterpriseConnectorActionsPerMessage: 0,
  fnExecutionsPerMessage: 1,
  fnGbSecondsPerMessage: 0.2,
  serviceBusOpsPerMessage: 2,
  storageTransactionsPerMessage: 14, // ~one per action for a stateful workflow
  sharedPlanCapacityPerMonth: 2_000_000,
  workflowsPerPlan: 20,
  stateful: true,
};

/** Fill model params from a flow's volumetrics, falling back to the defaults. */
export function resolveParams(volumetrics: Volumetrics): CostModelParams {
  const actions = volumetrics.actionsPerMessage;
  const builtIn = actions?.builtIn ?? DEFAULT_MODEL_PARAMS.builtInActionsPerMessage;
  const standardConnector =
    actions?.standardConnector ?? DEFAULT_MODEL_PARAMS.standardConnectorActionsPerMessage;
  const enterpriseConnector =
    actions?.enterpriseConnector ?? DEFAULT_MODEL_PARAMS.enterpriseConnectorActionsPerMessage;
  const stateful = volumetrics.stateful ?? DEFAULT_MODEL_PARAMS.stateful;

  return {
    ...DEFAULT_MODEL_PARAMS,
    builtInActionsPerMessage: builtIn,
    standardConnectorActionsPerMessage: standardConnector,
    enterpriseConnectorActionsPerMessage: enterpriseConnector,
    // a stateful workflow persists roughly one storage transaction per action
    storageTransactionsPerMessage: builtIn + standardConnector + enterpriseConnector,
    workflowsPerPlan: volumetrics.workflowsPerPlan ?? DEFAULT_MODEL_PARAMS.workflowsPerPlan,
    stateful,
  };
}

/** Messages/month a flow is priced at, from its volumetrics. */
export function messagesPerMonth(volumetrics: Volumetrics): number {
  return volumetrics.messagesPerMonth.value;
}
