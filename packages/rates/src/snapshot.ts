import type { RateCard } from '@ibexcairn/core-types';
import { LEAF_METERS, METER_KEYS, REQUIRED_METER_KEYS, WS1, type MeterKey } from './catalog';
import type { RetailClient, RetailItem } from './azureRetailClient';
import { RETAIL_API_VERSION } from './azureRetailClient';

export const SNAPSHOT_SCHEMA_VERSION = 1;

/** One resolved rate, with the source row kept for audit and drift review. */
export interface SnapshotRate {
  readonly value: number;
  readonly canonicalUnit: string;
  readonly meterId: string;
  readonly meterName: string;
  readonly sourceUnitOfMeasure: string;
  readonly sourceRetailPrice: number;
}

/** A captured rate card for one region. This is the on-disk fixture format and
 * exactly what LiveRateCard writes - a fixture is a real capture, not a mock. */
export interface RateSnapshot {
  readonly schemaVersion: number;
  readonly apiVersion: string;
  readonly region: string;
  readonly currency: string;
  readonly retrievedOn: string;
  readonly rates: Readonly<Record<string, SnapshotRate>>;
}

class MeterDriftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MeterDriftError';
  }
}

function resolveLeaf(
  key: MeterKey,
  itemsByService: ReadonlyMap<string, readonly RetailItem[]>,
): SnapshotRate {
  const meter = LEAF_METERS.find((m) => m.key === key);
  if (!meter) throw new MeterDriftError(`No catalogue entry for meter key '${key}'`);

  const pool = itemsByService.get(meter.serviceName) ?? [];
  const matches = pool.filter(
    (it) =>
      it.meterName === meter.meterName &&
      it.type === meter.type &&
      it.unitOfMeasure === meter.expectedUnit &&
      (meter.skuName === undefined || it.skuName === meter.skuName),
  );

  if (matches.length === 0) {
    throw new MeterDriftError(
      `Meter drift: no row for '${key}' (serviceName='${meter.serviceName}', ` +
        `meterName='${meter.meterName}', unit='${meter.expectedUnit}'` +
        (meter.skuName ? `, sku='${meter.skuName}'` : '') +
        `). Azure may have renamed the meter or changed its unit.`,
    );
  }
  if (matches.length > 1 && meter.pick === 'only') {
    throw new MeterDriftError(
      `Meter drift: expected one row for '${key}' but found ${matches.length}. ` +
        `Refine the selector or set an explicit pick strategy.`,
    );
  }

  const chosen = matches.reduce((acc, it) => {
    if (meter.pick === 'min') return it.retailPrice < acc.retailPrice ? it : acc;
    if (meter.pick === 'max') return it.retailPrice > acc.retailPrice ? it : acc;
    return acc;
  }, matches[0]!);

  return {
    value: chosen.retailPrice / meter.divisor,
    canonicalUnit: meter.canonicalUnit,
    meterId: chosen.meterId,
    meterName: chosen.meterName,
    sourceUnitOfMeasure: chosen.unitOfMeasure,
    sourceRetailPrice: chosen.retailPrice,
  };
}

/**
 * Build a snapshot from raw feed items. Pure given its inputs: no network, no
 * clock (retrievedOn is passed in so callers stay deterministic in tests).
 * Throws MeterDriftError if any required meter cannot be resolved.
 */
export function buildSnapshot(
  region: string,
  itemsByService: ReadonlyMap<string, readonly RetailItem[]>,
  retrievedOn: string,
): RateSnapshot {
  const rates: Record<string, SnapshotRate> = {};

  for (const key of REQUIRED_METER_KEYS) {
    if (key === METER_KEYS.laStandardWs1Month) continue; // composite, computed below
    rates[key] = resolveLeaf(key, itemsByService);
  }

  // Composite: WS1 plan = 1 vCPU + 3.5 GiB over 730h, from the duration meters.
  const vcpu = rates[METER_KEYS.laStandardVcpuHour]!;
  const mem = rates[METER_KEYS.laStandardMemoryGibHour]!;
  const ws1Monthly =
    vcpu.value * WS1.vcpu * WS1.hoursPerMonth + mem.value * WS1.memoryGiB * WS1.hoursPerMonth;
  rates[METER_KEYS.laStandardWs1Month] = {
    value: ws1Monthly,
    canonicalUnit: 'per month',
    meterId: 'composite',
    meterName: `composite: WS1 (${WS1.vcpu} vCPU + ${WS1.memoryGiB} GiB x ${WS1.hoursPerMonth}h)`,
    sourceUnitOfMeasure: 'derived',
    sourceRetailPrice: ws1Monthly,
  };

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    apiVersion: RETAIL_API_VERSION,
    region,
    currency: 'USD',
    retrievedOn,
    rates,
  };
}

/** Fetch every catalogue service for a region and build a snapshot. */
export async function captureSnapshot(
  region: string,
  client: RetailClient,
  retrievedOn: string,
): Promise<RateSnapshot> {
  const services = [...new Set(LEAF_METERS.map((m) => m.serviceName))];
  const itemsByService = new Map<string, readonly RetailItem[]>();
  for (const service of services) {
    itemsByService.set(service, await client.fetchService(service, region));
  }
  return buildSnapshot(region, itemsByService, retrievedOn);
}

/** Wrap a snapshot as a RateCard. meterRate throws (naming the key and listing
 * what is available) rather than returning zero for an unknown meter. */
export function rateCardFromSnapshot(snapshot: RateSnapshot): RateCard {
  return {
    region: snapshot.region,
    retrievedOn: snapshot.retrievedOn,
    meterRate(meterKey: string): number {
      const rate = snapshot.rates[meterKey];
      if (!rate) {
        throw new Error(
          `Unknown meter key '${meterKey}' in the ${snapshot.region} rate card. ` +
            `Available: ${Object.keys(snapshot.rates).sort().join(', ')}`,
        );
      }
      return rate.value;
    },
  };
}

/** Validate that a snapshot resolves every meter the cost engine requires.
 * Used on load so a stale or hand-edited fixture fails loudly, not silently. */
export function assertSnapshotComplete(snapshot: RateSnapshot): void {
  const missing = REQUIRED_METER_KEYS.filter((k) => !(k in snapshot.rates));
  if (missing.length > 0) {
    throw new Error(
      `Rate snapshot for '${snapshot.region}' is missing required meters: ${missing.join(', ')}`,
    );
  }
}

export { MeterDriftError };
