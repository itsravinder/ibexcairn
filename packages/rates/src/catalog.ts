/**
 * Meter catalogue: the stable internal meter keys the cost engine asks for,
 * mapped to selectors against Azure Retail Prices API items.
 *
 * The cost model never sees an Azure meterId (a GUID that changes); it asks for
 * a stable key like `logicapps.consumption.action.enterpriseConnector`. This
 * catalogue is the one place that knows how to find that price in the raw feed,
 * and the expected `unitOfMeasure` here is the drift tripwire: if Azure changes
 * a meter's unit, the selector matches nothing and S12 fails loudly rather than
 * pricing it as zero. See docs/specs/001-cost-engine.md step 2.
 */

/** Stable meter keys. Values are the strings passed to RateCard.meterRate(). */
export const METER_KEYS = {
  laBuiltinAction: 'logicapps.consumption.action.builtin',
  laStandardConnectorAction: 'logicapps.consumption.action.standardConnector',
  laEnterpriseConnectorAction: 'logicapps.consumption.action.enterpriseConnector',
  laStandardVcpuHour: 'logicapps.standard.vcpu.hour',
  laStandardMemoryGibHour: 'logicapps.standard.memory.gibHour',
  laStandardWs1Month: 'logicapps.standard.ws1.month',
  sbBaseMonth: 'servicebus.standard.base.month',
  sbOperation: 'servicebus.standard.operation',
  fnExecution: 'functions.ondemand.execution',
  fnGbSecond: 'functions.ondemand.gbSecond',
  storageTableTransaction: 'storage.table.transaction',
} as const;

export type MeterKey = (typeof METER_KEYS)[keyof typeof METER_KEYS];

/** Every key the cost model (S13) resolves. The committed fixture must satisfy
 * all of these, and a live capture must map all of them or fail. */
export const REQUIRED_METER_KEYS: readonly MeterKey[] = Object.values(METER_KEYS);

/** When several rows share a meterName (tiered pricing, or a free tier plus a
 * paid tier), which to keep. `only` asserts exactly one row - more is drift. */
export type Pick = 'only' | 'max' | 'min';

/** A leaf meter resolved directly from one Retail Prices row. */
export interface LeafMeter {
  readonly key: MeterKey;
  readonly serviceName: string;
  readonly meterName: string;
  readonly skuName?: string;
  readonly type: string;
  /** Expected unitOfMeasure. A mismatch is treated as meter drift. */
  readonly expectedUnit: string;
  /** retailPrice / divisor = canonical per-unit price. */
  readonly divisor: number;
  readonly pick: Pick;
  /** Human label for the canonical unit, stored in the snapshot for audit. */
  readonly canonicalUnit: string;
}

/**
 * Leaf meters, grounded in a live probe of eastus on 26 July 2026. Prices are
 * not hard-coded here - only the selectors are. The values come from the feed.
 */
export const LEAF_METERS: readonly LeafMeter[] = [
  {
    key: METER_KEYS.laBuiltinAction,
    serviceName: 'Logic Apps',
    meterName: 'Consumption Built-in Actions',
    type: 'Consumption',
    expectedUnit: '1',
    divisor: 1,
    pick: 'max', // two rows: a 0.0 free tier and the marginal price. Keep marginal.
    canonicalUnit: 'per action',
  },
  {
    key: METER_KEYS.laStandardConnectorAction,
    serviceName: 'Logic Apps',
    meterName: 'Consumption Standard Connector Actions',
    type: 'Consumption',
    expectedUnit: '1',
    divisor: 1,
    pick: 'max',
    canonicalUnit: 'per action',
  },
  {
    key: METER_KEYS.laEnterpriseConnectorAction,
    serviceName: 'Logic Apps',
    meterName: 'Consumption Enterprise Connector Actions',
    type: 'Consumption',
    expectedUnit: '1',
    divisor: 1,
    pick: 'max',
    canonicalUnit: 'per action',
  },
  {
    key: METER_KEYS.laStandardVcpuHour,
    serviceName: 'Logic Apps',
    meterName: 'Standard vCPU Duration',
    type: 'Consumption',
    expectedUnit: '1 Hour',
    divisor: 1,
    pick: 'only',
    canonicalUnit: 'per vCPU-hour',
  },
  {
    key: METER_KEYS.laStandardMemoryGibHour,
    serviceName: 'Logic Apps',
    meterName: 'Standard Memory Duration',
    type: 'Consumption',
    expectedUnit: '1 GiB Hour',
    divisor: 1,
    pick: 'only',
    canonicalUnit: 'per GiB-hour',
  },
  {
    key: METER_KEYS.sbBaseMonth,
    serviceName: 'Service Bus',
    meterName: 'Standard Base Unit',
    skuName: 'Standard',
    type: 'Consumption',
    expectedUnit: '1/Month',
    divisor: 1,
    pick: 'only',
    canonicalUnit: 'per month',
  },
  {
    key: METER_KEYS.sbOperation,
    serviceName: 'Service Bus',
    meterName: 'Standard Messaging Operations',
    skuName: 'Standard',
    type: 'Consumption',
    expectedUnit: '1M',
    divisor: 1_000_000,
    pick: 'max', // tiered; keep the highest marginal tier (conservative).
    canonicalUnit: 'per operation',
  },
  {
    key: METER_KEYS.fnExecution,
    serviceName: 'Functions',
    meterName: 'On Demand Total Executions',
    type: 'Consumption',
    expectedUnit: '10',
    divisor: 10,
    pick: 'max', // free tier (0.0) plus marginal price; keep the marginal
    canonicalUnit: 'per execution',
  },
  {
    key: METER_KEYS.fnGbSecond,
    serviceName: 'Functions',
    meterName: 'On Demand Execution Time',
    type: 'Consumption',
    expectedUnit: '1 GB Second',
    divisor: 1,
    pick: 'max', // may carry a free tier alongside the marginal price
    canonicalUnit: 'per GB-second',
  },
  {
    key: METER_KEYS.storageTableTransaction,
    serviceName: 'Storage',
    meterName: 'Batch Write Operations',
    skuName: 'Standard LRS',
    type: 'Consumption',
    expectedUnit: '10K',
    divisor: 10_000,
    pick: 'max',
    canonicalUnit: 'per transaction',
  },
];

/** Distinct service names the live client must query. */
export const CATALOG_SERVICE_NAMES: readonly string[] = [
  ...new Set(LEAF_METERS.map((m) => m.serviceName)),
];

/** Workflow Service Plan WS1 = 1 vCPU + 3.5 GiB, billed on compute duration.
 * Derived from the two Standard duration meters rather than a single SKU meter,
 * because that is how the plan is actually priced. ~$182/month in eastus. */
export const WS1 = {
  vcpu: 1,
  memoryGiB: 3.5,
  hoursPerMonth: 730,
} as const;
