import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FixtureRateCard, METER_KEYS, REQUIRED_METER_KEYS } from './index';
import type { RateSnapshot } from './index';

const FIXTURE = join(__dirname, '..', 'fixtures', 'eastus.json');

describe('FixtureRateCard (committed eastus snapshot)', () => {
  it('resolves every required meter to a positive, finite number', async () => {
    const card = await new FixtureRateCard().load('eastus');
    for (const key of REQUIRED_METER_KEYS) {
      const value = card.meterRate(key);
      expect(Number.isFinite(value), key).toBe(true);
      expect(value, key).toBeGreaterThan(0);
    }
  });

  it('prices the three connector classes at the known eastus rates', async () => {
    const card = await new FixtureRateCard().load('eastus');
    expect(card.meterRate(METER_KEYS.laBuiltinAction)).toBeCloseTo(0.000025, 9);
    expect(card.meterRate(METER_KEYS.laStandardConnectorAction)).toBeCloseTo(0.000125, 9);
    expect(card.meterRate(METER_KEYS.laEnterpriseConnectorAction)).toBeCloseTo(0.001, 9);
  });

  it('derives the WS1 plan near $180/month from the duration meters', async () => {
    const card = await new FixtureRateCard().load('eastus');
    const ws1 = card.meterRate(METER_KEYS.laStandardWs1Month);
    expect(ws1).toBeGreaterThan(150);
    expect(ws1).toBeLessThan(220);
  });

  it('throws, naming the key, for an unknown meter', async () => {
    const card = await new FixtureRateCard().load('eastus');
    expect(() => card.meterRate('does.not.exist')).toThrow(/does\.not\.exist/);
  });

  it('rejects a corrupted fixture, naming the missing meter', async () => {
    const snapshot = JSON.parse(readFileSync(FIXTURE, 'utf8')) as RateSnapshot;
    const mutable = snapshot as { rates: Record<string, unknown> };
    delete mutable.rates[METER_KEYS.laEnterpriseConnectorAction];

    const dir = mkdtempSync(join(tmpdir(), 'ibex-rates-'));
    writeFileSync(join(dir, 'eastus.json'), JSON.stringify(snapshot));

    await expect(new FixtureRateCard(dir).load('eastus')).rejects.toThrow(/enterpriseConnector/);
  });

  it('rejects a missing region file with a clear message', async () => {
    await expect(new FixtureRateCard().load('no-such-region')).rejects.toThrow(/No rate fixture/);
  });
});
