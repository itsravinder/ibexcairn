import { describe, it, expect } from 'vitest';
import { buildSnapshot, MeterDriftError, METER_KEYS } from './index';
import type { RetailItem } from './index';

/** Build a retail row with sensible defaults. */
function row(partial: Partial<RetailItem>): RetailItem {
  return {
    meterId: 'meter-' + (partial.meterName ?? 'x'),
    meterName: '',
    skuName: '',
    productName: '',
    serviceName: '',
    unitOfMeasure: '',
    retailPrice: 0,
    armRegionName: 'eastus',
    type: 'Consumption',
    currencyCode: 'USD',
    ...partial,
  };
}

/** A complete, valid set of rows covering every leaf meter. */
const VALID_ROWS: RetailItem[] = [
  row({ serviceName: 'Logic Apps', meterName: 'Consumption Built-in Actions', unitOfMeasure: '1', retailPrice: 0 }),
  row({ serviceName: 'Logic Apps', meterName: 'Consumption Built-in Actions', unitOfMeasure: '1', retailPrice: 0.000025 }),
  row({ serviceName: 'Logic Apps', meterName: 'Consumption Standard Connector Actions', unitOfMeasure: '1', retailPrice: 0.000125 }),
  row({ serviceName: 'Logic Apps', meterName: 'Consumption Enterprise Connector Actions', unitOfMeasure: '1', retailPrice: 0.001 }),
  row({ serviceName: 'Logic Apps', meterName: 'Standard vCPU Duration', unitOfMeasure: '1 Hour', retailPrice: 0.1997 }),
  row({ serviceName: 'Logic Apps', meterName: 'Standard Memory Duration', unitOfMeasure: '1 GiB Hour', retailPrice: 0.0143 }),
  row({ serviceName: 'Service Bus', meterName: 'Standard Base Unit', skuName: 'Standard', unitOfMeasure: '1/Month', retailPrice: 10 }),
  row({ serviceName: 'Service Bus', meterName: 'Standard Messaging Operations', skuName: 'Standard', unitOfMeasure: '1M', retailPrice: 0.8 }),
  row({ serviceName: 'Functions', meterName: 'On Demand Total Executions', unitOfMeasure: '10', retailPrice: 0.000004 }),
  row({ serviceName: 'Functions', meterName: 'On Demand Execution Time', unitOfMeasure: '1 GB Second', retailPrice: 0.000026 }),
  row({ serviceName: 'Storage', meterName: 'Batch Write Operations', skuName: 'Standard LRS', unitOfMeasure: '10K', retailPrice: 0.00036 }),
];

function byService(rows: readonly RetailItem[]): Map<string, RetailItem[]> {
  const map = new Map<string, RetailItem[]>();
  for (const item of rows) {
    const list = map.get(item.serviceName) ?? [];
    list.push(item);
    map.set(item.serviceName, list);
  }
  return map;
}

describe('buildSnapshot (offline, no network)', () => {
  it('resolves leaf meters and normalises to canonical units', () => {
    const snap = buildSnapshot('eastus', byService(VALID_ROWS), '2026-07-29T00:00:00Z');
    // free tier ignored, marginal kept
    expect(snap.rates[METER_KEYS.laBuiltinAction]?.value).toBeCloseTo(0.000025, 9);
    // 0.8 per 1M normalised to per-operation
    expect(snap.rates[METER_KEYS.sbOperation]?.value).toBeCloseTo(0.8 / 1_000_000, 12);
    // per-10-executions normalised to per-execution
    expect(snap.rates[METER_KEYS.fnExecution]?.value).toBeCloseTo(0.0000004, 12);
  });

  it('computes the WS1 composite from the duration meters', () => {
    const snap = buildSnapshot('eastus', byService(VALID_ROWS), '2026-07-29T00:00:00Z');
    // 0.1997 * 730 + 0.0143 * 3.5 * 730
    expect(snap.rates[METER_KEYS.laStandardWs1Month]?.value).toBeCloseTo(182.3175, 3);
  });

  it('fails loudly, naming the key, when a meter is absent', () => {
    const rows = VALID_ROWS.filter(
      (r) => r.meterName !== 'Consumption Enterprise Connector Actions',
    );
    expect(() => buildSnapshot('eastus', byService(rows), 't')).toThrow(MeterDriftError);
    expect(() => buildSnapshot('eastus', byService(rows), 't')).toThrow(/enterpriseConnector/);
  });

  it('treats a changed unitOfMeasure as drift rather than pricing it wrong', () => {
    const rows = VALID_ROWS.map((r) =>
      r.meterName === 'Standard vCPU Duration' ? { ...r, unitOfMeasure: '1 Hr' } : r,
    );
    expect(() => buildSnapshot('eastus', byService(rows), 't')).toThrow(/vcpu/);
  });
});
