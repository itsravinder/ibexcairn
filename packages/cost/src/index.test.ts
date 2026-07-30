import { describe, it, expect } from 'vitest';
import { METER_KEYS, type RateCard, type Volumetrics } from '@ibexcairn/core-types';
import { cost, priceAll, cheapest, findCrossovers } from './index';

/**
 * Real eastus meter values captured from the Azure Retail Prices API in S12
 * (packages/rates/fixtures/eastus.json). Inlined so the cost tests stay
 * dependency-clean (core-types only) and deterministic. cost() is pure, so
 * given these rates the numbers are fixed and can be pinned.
 */
const EASTUS: Record<string, number> = {
  [METER_KEYS.laBuiltinAction]: 0.000025,
  [METER_KEYS.laStandardConnectorAction]: 0.000125,
  [METER_KEYS.laEnterpriseConnectorAction]: 0.001,
  [METER_KEYS.laStandardVcpuHour]: 0.1997,
  [METER_KEYS.laStandardMemoryGibHour]: 0.0143,
  [METER_KEYS.laStandardWs1Month]: 182.3175,
  [METER_KEYS.sbBaseMonth]: 10,
  [METER_KEYS.sbOperation]: 0.0000008,
  [METER_KEYS.fnExecution]: 0.0000004,
  [METER_KEYS.fnGbSecond]: 0.000026,
  [METER_KEYS.storageTableTransaction]: 0.000000036,
};

function rateCard(rates: Record<string, number> = EASTUS): RateCard {
  return {
    region: 'eastus',
    retrievedOn: '2026-07-29T00:00:00Z',
    meterRate(key: string): number {
      const v = rates[key];
      if (v === undefined) throw new Error(`unknown meter '${key}'`);
      return v;
    },
  };
}

function flow(m: number, opts: { enterprise?: boolean; share?: number; stateful?: boolean } = {}): Volumetrics {
  return {
    messagesPerMonth: { value: m, provenance: 'assumed' },
    stateful: opts.stateful ?? true,
    workflowsPerPlan: opts.share ?? 20,
    actionsPerMessage: {
      builtIn: 12,
      standardConnector: 2,
      enterpriseConnector: opts.enterprise ? 1 : 0,
    },
  };
}

const rc = rateCard();

describe('cost model - acceptance (real eastus rates)', () => {
  it('A: default flow has exactly two crossovers, cons -> shared -> function', () => {
    const { crossovers } = findCrossovers(flow(1), rc);
    expect(crossovers).toHaveLength(2);
    expect(crossovers[0]?.from).toBe('logicapps-consumption');
    expect(crossovers[0]?.to).toBe('logicapps-standard-shared');
    expect(crossovers[0]?.atVolume).toBeGreaterThan(15_000);
    expect(crossovers[0]?.atVolume).toBeLessThan(18_500);
    expect(crossovers[1]?.from).toBe('logicapps-standard-shared');
    expect(crossovers[1]?.to).toBe('function-servicebus');
    expect(crossovers[1]?.atVolume).toBeGreaterThan(1_900_000);
    expect(crossovers[1]?.atVolume).toBeLessThan(2_200_000);
  });

  it('B: an enterprise-connector flow collapses to a single crossover, straight to function', () => {
    const { crossovers } = findCrossovers(flow(1, { enterprise: true }), rc);
    expect(crossovers).toHaveLength(1);
    expect(crossovers[0]?.from).toBe('logicapps-consumption');
    expect(crossovers[0]?.to).toBe('function-servicebus');
    expect(crossovers[0]?.atVolume).toBeGreaterThan(6_000);
    expect(crossovers[0]?.atVolume).toBeLessThan(7_500);
  });

  it('C: a dedicated plan (share=1) is never the cheapest below 2M/month', () => {
    for (const m of [1_000, 10_000, 100_000, 1_000_000, 1_900_000]) {
      expect(cheapest(flow(m, { share: 1 }), rc).candidate).not.toBe('logicapps-standard-dedicated');
    }
  });

  it('D: point costs at 10k/month match the real rate card', () => {
    const by = new Map(priceAll(flow(10_000), rc).map((b) => [b.candidate, b.monthlyCost]));
    expect(by.get('logicapps-consumption')).toBeCloseTo(5.5, 2);
    expect(by.get('logicapps-standard-shared')).toBeCloseTo(9.12, 1);
    expect(by.get('function-servicebus')).toBeCloseTo(10.05, 1);
    expect(by.get('logicapps-standard-dedicated')).toBeCloseTo(182.33, 1);
  });

  it('E: at 3M/month the function wins and the shared plan has stepped up to dedicated', () => {
    const all = priceAll(flow(3_000_000), rc);
    expect(all[0]?.candidate).toBe('function-servicebus');
    const shared = all.find((b) => b.candidate === 'logicapps-standard-shared')?.monthlyCost ?? 0;
    const dedicated = all.find((b) => b.candidate === 'logicapps-standard-dedicated')?.monthlyCost ?? 0;
    expect(shared).toBeCloseTo(dedicated, 0); // shared stepped up to a full plan
  });
});

describe('cost model - the five billing rules, isolated', () => {
  it('1: consumption meters every action by connector class', () => {
    const b = cost({ candidate: 'logicapps-consumption', region: 'eastus' }, flow(1000, { enterprise: true }), rc);
    const meters = b.lineItems.map((li) => li.meterId);
    expect(meters).toContain(METER_KEYS.laBuiltinAction);
    expect(meters).toContain(METER_KEYS.laStandardConnectorAction);
    expect(meters).toContain(METER_KEYS.laEnterpriseConnectorAction);
  });

  it('2: Standard includes built-in/standard connectors, meters only enterprise', () => {
    const b = cost({ candidate: 'logicapps-standard-dedicated', region: 'eastus' }, flow(1000, { enterprise: true }), rc);
    const meters = b.lineItems.map((li) => li.meterId);
    expect(meters).not.toContain(METER_KEYS.laBuiltinAction);
    expect(meters).not.toContain(METER_KEYS.laStandardConnectorAction);
    expect(meters).toContain(METER_KEYS.laEnterpriseConnectorAction);
    expect(meters).toContain(METER_KEYS.laStandardWs1Month);
  });

  it('3: stateful incurs storage transactions; stateless does not', () => {
    const stateful = cost({ candidate: 'logicapps-standard-dedicated', region: 'eastus' }, flow(1000, { stateful: true }), rc);
    const stateless = cost({ candidate: 'logicapps-standard-dedicated', region: 'eastus' }, flow(1000, { stateful: false }), rc);
    expect(stateful.lineItems.map((li) => li.meterId)).toContain(METER_KEYS.storageTableTransaction);
    expect(stateless.lineItems.map((li) => li.meterId)).not.toContain(METER_KEYS.storageTableTransaction);
  });

  it('4: a shared plan steps up to a full plan past capacity', () => {
    const below = cost({ candidate: 'logicapps-standard-shared', region: 'eastus' }, flow(1_000_000), rc);
    const above = cost({ candidate: 'logicapps-standard-shared', region: 'eastus' }, flow(3_000_000), rc);
    const planBelow = below.lineItems.find((li) => li.meterId === METER_KEYS.laStandardWs1Month);
    const planAbove = above.lineItems.find((li) => li.meterId === METER_KEYS.laStandardWs1Month);
    expect(planBelow?.quantity).toBeCloseTo(1 / 20, 5); // 1/N below capacity
    expect(planAbove?.quantity).toBe(1); // full plan above capacity
  });

  it('5: the function path charges a Service Bus base plus per-operation', () => {
    const b = cost({ candidate: 'function-servicebus', region: 'eastus' }, flow(1000), rc);
    const meters = b.lineItems.map((li) => li.meterId);
    expect(meters).toContain(METER_KEYS.sbBaseMonth);
    expect(meters).toContain(METER_KEYS.sbOperation);
    // native SDK: no connector meter at all
    expect(meters).not.toContain(METER_KEYS.laEnterpriseConnectorAction);
  });
});

describe('cost breakdown - provenance and traceability (ADR-0004)', () => {
  it('every line item carries a meter id and the volume provenance', () => {
    const b = cost({ candidate: 'logicapps-consumption', region: 'eastus' }, flow(1000), rc);
    expect(b.lineItems.length).toBeGreaterThan(0);
    for (const li of b.lineItems) {
      expect(li.meterId).toBeTruthy();
      expect(li.provenance).toBe('assumed');
      expect(li.monthlyCost).toBeCloseTo(li.quantity * li.unitRate, 10);
    }
    expect(b.monthlyCost).toBeCloseTo(
      b.lineItems.reduce((s, li) => s + li.monthlyCost, 0),
      10,
    );
  });
});
