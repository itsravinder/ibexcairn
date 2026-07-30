import {
  METER_KEYS,
  type CandidateId,
  type CostLineItem,
  type Provenance,
  type RateCard,
} from '@ibexcairn/core-types';
import type { CostModelParams } from './model';

/** Build one costed line, pricing `quantity` of a meter from the rate card. */
function line(
  label: string,
  meterKey: string,
  quantity: number,
  rateCard: RateCard,
  provenance: Provenance,
): CostLineItem {
  const unitRate = rateCard.meterRate(meterKey);
  return {
    label,
    meterId: meterKey,
    quantity,
    unitRate,
    monthlyCost: quantity * unitRate,
    provenance,
  };
}

/**
 * Line items for one candidate at `m` messages/month. The billing rules that
 * matter (and that we have got wrong before) live here:
 *
 *  1. Consumption meters EVERY action, by connector class.
 *  2. Standard includes built-in + standard-connector actions in the plan and
 *     meters ONLY enterprise/managed connectors.
 *  3. Stateful workflows incur storage transactions; stateless incur none.
 *  4. A shared plan steps up to a dedicated plan past its capacity ceiling.
 *  5. Service Bus charges a base rate plus per-operation.
 */
export function candidateLines(
  candidate: CandidateId,
  m: number,
  params: CostModelParams,
  rateCard: RateCard,
  provenance: Provenance,
): CostLineItem[] {
  const p = params;
  const enterprise = m * p.enterpriseConnectorActionsPerMessage;
  const storage = p.stateful ? m * p.storageTransactionsPerMessage : 0;

  switch (candidate) {
    case 'logicapps-consumption': {
      // rule 1: every action metered
      const lines = [
        line('Built-in actions', METER_KEYS.laBuiltinAction, m * p.builtInActionsPerMessage, rateCard, provenance),
        line('Standard connector actions', METER_KEYS.laStandardConnectorAction, m * p.standardConnectorActionsPerMessage, rateCard, provenance),
      ];
      if (enterprise > 0) {
        lines.push(line('Enterprise connector actions', METER_KEYS.laEnterpriseConnectorAction, enterprise, rateCard, provenance));
      }
      return lines;
    }

    case 'logicapps-standard-dedicated': {
      // rule 2: built-in + standard connectors are in-plan; only enterprise metered
      const lines = [line('WS1 plan', METER_KEYS.laStandardWs1Month, 1, rateCard, provenance)];
      if (enterprise > 0) {
        lines.push(line('Enterprise connector actions', METER_KEYS.laEnterpriseConnectorAction, enterprise, rateCard, provenance));
      }
      if (storage > 0) {
        lines.push(line('Storage transactions (stateful)', METER_KEYS.storageTableTransaction, storage, rateCard, provenance));
      }
      return lines;
    }

    case 'logicapps-standard-shared': {
      // rule 4: below capacity, 1/N of a plan; at/above capacity, a full plan
      const planUnits = m > p.sharedPlanCapacityPerMonth ? 1 : 1 / p.workflowsPerPlan;
      const label = m > p.sharedPlanCapacityPerMonth
        ? 'WS1 plan (capacity exceeded - dedicated)'
        : `WS1 plan (shared 1/${p.workflowsPerPlan})`;
      const lines = [line(label, METER_KEYS.laStandardWs1Month, planUnits, rateCard, provenance)];
      if (enterprise > 0) {
        lines.push(line('Enterprise connector actions', METER_KEYS.laEnterpriseConnectorAction, enterprise, rateCard, provenance));
      }
      if (storage > 0) {
        lines.push(line('Storage transactions (stateful)', METER_KEYS.storageTableTransaction, storage, rateCard, provenance));
      }
      return lines;
    }

    case 'function-servicebus': {
      // native SDK in the function: NO connector meter at all - the big lever
      return [
        line('Service Bus base', METER_KEYS.sbBaseMonth, 1, rateCard, provenance),
        line('Function executions', METER_KEYS.fnExecution, m * p.fnExecutionsPerMessage, rateCard, provenance),
        line('Function GB-seconds', METER_KEYS.fnGbSecond, m * p.fnGbSecondsPerMessage, rateCard, provenance),
        line('Service Bus operations', METER_KEYS.sbOperation, m * p.serviceBusOpsPerMessage, rateCard, provenance),
      ];
    }
  }
}

export const ALL_CANDIDATES: readonly CandidateId[] = [
  'logicapps-consumption',
  'logicapps-standard-dedicated',
  'logicapps-standard-shared',
  'function-servicebus',
];
