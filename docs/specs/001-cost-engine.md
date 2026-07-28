# Spec 001 · Cost engine (S03 → S12 → S13)

**Status:** ready to implement
**Stages:** S03 scaffold, S12 rate card client, S13 cost model — **in this order, with a checkpoint after each**
**Written:** 26 July 2026, analysis phase

> **Why this increment first.** S01 (upstream licence review) blocks the fork, but these three stages contain **zero upstream dependency, zero customer data and zero BizTalk artefacts**. They are the product's differentiator, they are fully testable offline, and the acceptance numbers already exist (§Acceptance). Nothing here needs to be re-derived — implement to this spec.

---

## Step 1 · S03 Scaffold

### Layout

pnpm workspace, TypeScript **strict**, Node 22.

```
package.json            (workspace root, pnpm)
pnpm-workspace.yaml
tsconfig.base.json
packages/
  core-types/           types only — no runtime dependencies, no I/O
  rates/                Azure Retail Prices client, disk cache, fixture mode
  cost/                 pure functions — no fs, no network, no clock
  cli/                  ibexcairn <command>
```

**The `cost` package must have no I/O and no ambient state.** No `fs`, no `fetch`, no `Date.now()`, no `Math.random()`. Rates and volumetrics arrive as arguments. This is what makes it unit-testable and reproducible, and it is the single most important structural rule in this increment.

### Tooling

- Build: `tsc` project references (not a bundler — these are libraries)
- Test: `vitest`
- Lint: `eslint` + `@typescript-eslint`, `no-floating-promises` on
- Format: `prettier`

### CI — `.github/workflows/ci.yml`

- Matrix: **`windows-latest` and `ubuntu-latest`**. Windows is mandatory, not optional — Logic Apps Standard custom-functions tooling is Windows-only ([ADR-0008](../adr/0008-portability-ladder.md))
- Steps: install → lint → typecheck → test → build
- **A failing check that greps for `vscode` imports in `packages/`** — a rule enforced by CI, not a convention in a document

### Definition of done

- [ ] `pnpm install && pnpm -r build && pnpm -r test` green on both OSes
- [ ] `packages/cost` has zero dependencies beyond `core-types`
- [ ] The no-`vscode`-imports check fails when a violation is introduced deliberately (prove it, don't assume it)
- [ ] `pnpm ibexcairn --help` runs

**Checkpoint — stop here and report before starting Step 2.**

---

## Step 2 · S12 Rate card client

### Source

```
GET https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview
```

Unauthenticated. OData `$filter` on `serviceName` and `armRegionName`. Paginated via `NextPageLink` — follow it to exhaustion.

### Meters required

| Service | What to capture |
|---|---|
| Logic Apps | Consumption action meters **by connector class** (built-in, standard, enterprise); Workflow Service Plan SKUs (WS1/WS2/WS3) |
| Azure Functions | Flex Consumption executions and GB-seconds |
| Service Bus | Namespace base charge per tier; operations |
| Storage | Table, queue and blob transaction meters |
| API Management | Tier meters (Consumption, Basic v2, Standard v2) |
| Event Grid | Operations |
| Container Apps | vCPU-seconds and memory GiB-seconds |

### Behaviour

- **Snapshot to disk as a versioned fixture**, keyed by region + retrieval date
- `RateCardSource` has two implementations: `LiveRateCard` (network) and `FixtureRateCard` (disk). **Tests use only the fixture.** A cost test must never fail because Microsoft edited a price — that is the wrong signal and it will train the team to ignore the suite
- **Fail loudly on schema drift**: a meter that disappears, changes unit, or changes `unitOfMeasure` raises rather than silently returning zero. A missing meter priced as free is the most dangerous failure mode in this package
- Cache TTL configurable; default 24h for live mode

### Definition of done

- [ ] `FixtureRateCard` loads a committed snapshot and resolves every meter the cost model needs
- [ ] `LiveRateCard` fetches, paginates fully, and writes a snapshot
- [ ] A deliberately corrupted fixture (renamed meter) causes a thrown error naming the missing meter
- [ ] One committed snapshot for `eastus`, used by all Step 3 tests
- [ ] No test in the repo performs network I/O

**Checkpoint — stop here and report before starting Step 3.**

---

## Step 3 · S13 Cost model

### Shape

```
cost(placement, volumetrics, rateCard) → CostBreakdown
```

`CostBreakdown` carries **line items with provenance**, not just a total. Every line records the meter ID it came from and whether the volumetric driving it was `measured` or `assumed`. A total without provenance is unusable in front of a CFO — the breakdown *is* the deliverable.

### Candidates to price

1. `logicapps-consumption`
2. `logicapps-standard-dedicated` (WS1)
3. `logicapps-standard-shared` (WS1 ÷ N workflows)
4. `function-servicebus`

Later candidates (Event Grid, APIM, Container Apps, ADF) plug into the same interface — design for that, don't build it now.

### The five billing rules

Each gets **its own test fixture**, because these are what drift and what we have already got wrong once:

1. **Consumption meters every action**, priced by class: built-in, standard connector, enterprise connector
2. **Standard includes built-in service-provider connectors in the plan and meters only enterprise/managed connectors.** ← We modelled this wrong in the first prototype and it changed which candidate won at most volumes. Test it explicitly
3. **Stateful workflows incur storage transactions** (queue, table, blob per action); stateless incur none
4. **A shared plan steps up to a dedicated plan** past its capacity ceiling — a discontinuity, not a slope
5. **Service Bus charges a base rate plus per-operation**

### Crossover detection

Scan log-spaced samples across the volume range and record every point where the cheapest candidate changes. Return `{ atVolume, from, to }` per flip. Do not interpolate — report the sampled bracket.

### Acceptance — known-answer tests

These numbers were verified numerically during analysis. **An implementation reproducing all five is correct; one that doesn't is wrong.**

Reference flow: 12 built-in + 2 standard-connector actions per message, 20 workflows sharing a plan, stateful, `eastus`.

| Test | Expected |
|---|---|
| **A** · default, full range | Exactly **two** crossovers: Consumption → shared Standard at **≈17,000/mo**; shared Standard → Function + Service Bus at **≈2,100,000/mo** |
| **B** · enterprise connector on | Collapses to **one** crossover at **≈7,000/mo**, directly to Function + Service Bus |
| **C** · `share = 1` (dedicated) | Dedicated never wins below 2M/mo |
| **D** · point costs at 10,000/mo | Consumption ≈ `$5.50` · shared ≈ `$9.01` · dedicated ≈ `$180` · Function ≈ `$10.01` |
| **E** · point costs at 3,000,000/mo | Function cheapest; shared has stepped up to dedicated pricing |

Tolerance: ±2% on money, ±1 sample bracket on crossover volumes.

### Definition of done

- [ ] All five acceptance tests pass against the committed fixture
- [ ] One isolating test per billing rule (five more)
- [ ] `packages/cost` still has zero I/O — verify, don't assume
- [ ] `ibexcairn cost --volume 100000 --enterprise-connector --share 20` prints the breakdown and the recommendation
- [ ] Every line item in the output names its meter and its volumetric provenance
- [ ] **No LLM call anywhere in this package** ([ADR-0004](../adr/0004-llm-never-produces-cost-figures.md))

---

## Out of scope for this increment

Do not build, and do not stub in a way that implies it exists: parsers, IR, ingest, disposition, archetype classification, constraint filter, portfolio bin-packing, diagrams, emitters, UI. Those are later stages and several depend on the unresolved S01 licence question.

Scope from [ADR-0006](../adr/0006-consume-upstream-converter.md) and [ADR-0007](../adr/0007-override-model-and-pattern-catalogue.md) is **Proposed, not accepted** — ignore both.

## On finishing

Record in [`STAGES.csv`](../../STAGES.csv): `status=done`, `verified=yes`, and the short commit hash, in a separate `chore:` commit. Tick the boxes in [10 · Stages](../10-stages.md) for S03, S12 and S13.
