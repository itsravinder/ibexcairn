# 10 · Stages and checklists

40 stages across six phases, tracked in [`STAGES.csv`](../STAGES.csv). Same column format as the `minerva` project, with one added `phase` column because this build has gated phases rather than one continuous run.

> **Scope not yet included here.** [ADR-0006](adr/0006-consume-upstream-converter.md) (consume upstream's converter) and [ADR-0007](adr/0007-override-model-and-pattern-catalogue.md) (override model and pattern catalogue) are **Proposed, not accepted**. The scope they imply is deliberately absent from these stages. If ADR-0006 is accepted, S19 shrinks to wrapping upstream's converter; if ADR-0007 is accepted, scope lands in S13, S15, S18, S23, S24, S28, S29 and S31.

## How to use this

| Column | Values |
|---|---|
| `status` | `todo` · `in_progress` · `done` · `blocked` · `dropped` |
| `verified` | `no` · `yes` — `yes` means someone confirmed the exit criteria, not that the code compiles |
| `commit` | short hash, recorded in a follow-up `chore:` commit once the stage lands |
| `priority` | `P0` must-have · `P1` high · `P2` later — importance, **not** phase |

Working rhythm, per stage: set `in_progress` → implement → tick every checklist box → set `done` + `verified` → commit the work → record the hash in `STAGES.csv` in a separate `chore:` commit.

**Current status:** run `python scripts/status.py`. It prints per-phase completion, what is startable now, and what each remaining stage waits on — and it fails loudly if `STAGES.csv` develops a dependency cycle or a dangling reference.

`depends_on` means **cannot start before**, not *logically consumes*. S09, S12, S13 and S38 read databases, HTTP APIs and assemblies directly, so none of them wait on ingest or on the S01 licence outcome.

**A stage is not done until its checklist is complete.** The boxes below are the acceptance criteria, not suggestions.

---

## Phase gates

Four points where work stops until someone signs off. These exist because an unattended pipeline that provisions Azure resources and rewrites integration code is not something an enterprise will buy.

- [ ] **G0 · Foundation** — a headless CLI produces valid `ir.json` from a real BizTalk project, with no `vscode` dependency anywhere in the core packages
- [ ] **G1 · Assessment** — a stakeholder-ready cost and architecture pack for three representative applications that **an independent architect agrees with**. Not "the tool ran"
- [ ] **G2 · Conversion** — a published per-flow parity number on real golden messages
- [ ] **G3 · SaaS** — a customer completes a wave without anyone from our team touching their environment
- [ ] **G4 · Expansion** — two targets and four sources through one unchanged IR

---

# Foundation

## S00 · Brand + legal clearance `P1` — **in progress**

Parallel track; does not block engineering. Screening report: [S00 trademark screening](legal/S00-trademark-screening.md).

**Preliminary screening — done 26 Jul 2026:**

- [x] Public-record USPTO screening, Classes 9 and 42
- [x] Domain availability — `.com`, `.io`, `.dev`, `.ai` all free
- [x] GitHub organisation and npm scope availability — both free
- [x] "Cairn" checked as the distinguishing element — no software-category conflict

**Blocking, needs a lawyer or a person:**

- [ ] ⚠️ **Verify Reg. 5,985,152** (`IBEX`, Classes 9 + 42, goods cover *"software for integrating and automating separate software systems"*) against the primary USPTO/TSDR record
- [ ] **Attorney clearance opinion** on `IBEX CAIRN` vs that registration; secondarily Ibexa AS and IBEX Limited
- [ ] EUIPO search, Classes 9 and 42 — not covered by the screening
- [ ] **Go/no-go on the name while renaming is still nearly free**
- [ ] Register `ibexcairn.com` (+ defensively `.io`)
- [ ] Create the GitHub organisation, claim the `@ibexcairn` npm scope
- [ ] Azure Marketplace publisher name check (needs Partner Center)

If counsel advises against the root, **do not** fall back to another `Ibex *` compound — they inherit the same Class 9 exposure.

## S01 · Upstream licence review `P0` — **RESOLVED, fork permitted**

Verbatim MIT, no additional terms. Full review: [S01 · Upstream licence review](legal/S01-upstream-licence-review.md).

- [x] Read `LICENSE` and any contributor/usage terms — **unmodified MIT**, © 2026 Microsoft Corporation. No rider, no field-of-use restriction, no trademark clause. Only `LICENSE`, `README.md`, `SECURITY.md` exist
- [x] Decision recorded: **fork** ([ADR-0001](adr/0001-fork-logicapps-migration-agent.md) → Accepted). Hybrid fallback not needed
- [x] ~~If hybrid: reopen parser build scope~~ — not applicable
- [ ] Counsel glance at the MIT terms and attribution mechanics — a formality for unmodified MIT, but record it
- [ ] **Transitive dependency licence scan, gated in CI** — the only real remaining exposure
- [ ] Confirm the Azure *preview supplemental terms* attach to the hosted service and marketplace extension, not to MIT source
- [ ] Sponsor sign-off on ADR-0001

## S02 · Headless core extraction `P0` — **spike done, extraction pending S03**

Full plan and measurements: [Spec 002 · Headless extraction](specs/002-headless-extraction.md). Base commit `4b08eb8`.

**Spike — done 26 Jul 2026. Verdict: extraction is mechanical, not a rewrite.**

- [x] Confirm `src/parsers/**` and `src/ir/**` detach from the extension host — **yes**
- [x] Measured coupling: `parsers/` 18/29 files, but **16 of those use only `vscode.CancellationToken`**; `ir/` 1/21; `types/`, `constants/`, `workflowSchema/` already clean
- [x] Identified the only two real problems: `ParserPluginLoader.ts` (VS Code extension discovery — delete) and `ir/storage/IRStorage.ts` (`workspace.fs` — put behind an interface)
- [x] Telemetry isolated to exactly one file, `src/services/TelemetryService.ts`
- [x] Reuse tally: **26,451 of 63,460 lines lift (42%)**; the remainder was always going to be replaced
- [x] ⚠️ Found that **upstream does not clone on Windows** without `core.longpaths` — `resources/referenceDocs/**` exceeds `MAX_PATH`

**Extraction — needs the S03 scaffold to extract into:**

- [ ] Fork upstream, record base commit, **shorten the `resources/referenceDocs/**` paths** so the fork clones cleanly on Windows
- [ ] Define a `vscode`-free `CancellationToken` in `core-types`; mechanical replace across the 16 affected files
- [ ] Delete `ParserPluginLoader.ts` and the stale `vscode` import in `parsers/types.ts`
- [ ] Replace `IRStorage`'s `workspace.fs` with an `IArtefactStore` interface plus a Node `fs` implementation
- [ ] **Strip `TelemetryService.ts`**, `@vscode/extension-telemetry` and `@microsoft/applicationinsights-common` — a purchase condition for regulated customers, not a cleanup task
- [ ] **Sever `extensionDependencies: ["ms-azuretools.vscode-azurelogicapps"]`** — proprietary, not MIT
- [ ] Ship `THIRD-PARTY-NOTICES` carrying Microsoft's MIT notice
- [ ] **Prove it: build with `@types/vscode` absent from the tree.** CI greps for `vscode`, `telemetry` and `applicationinsights` in `packages/` and fails on a hit
- [ ] CLI `parse <path> --out ir.json` emits a schema-valid IR document from a real BizTalk project; round-trip test
- [ ] Catalogue the 13 skill files and `resources/agents/` prompts — plain Markdown, should port unchanged (S04)
- [ ] Record for later: upstream uses `xstate` for its stage machine (before S29); `mermaid` and `docx` are already dependencies (S16/S17)

## S03 · Repo scaffold + CI `P0` — **built, CI-observation pending**

Built to [Spec 001 step 1](specs/001-cost-engine.md). pnpm workspace with four packages — `core-types`, `rates`, `cost`, `cli` — tsc project references, vitest, type-checked eslint, prettier.

- [x] Monorepo layout, build, lint, unit test harness — `pnpm install / build / test / lint` all green locally
- [x] GitHub Actions running build + tests on PR (`.github/workflows/ci.yml`)
- [x] **Windows build agents** — matrix is `ubuntu-latest` + `windows-latest` ([ADR-0008](adr/0008-portability-ladder.md))
- [x] **`git config core.longpaths true` in the Windows CI job** — for the upstream content S02 will add
- [x] **CI check enforcing no `vscode` imports** — `scripts/check-no-vscode.mjs`, **proven to exit 1 on a planted import** and 0 when clean
- [x] `packages/cost` depends on nothing beyond `core-types` (DoD)
- [x] `pnpm ibexcairn --help` runs (DoD)
- [ ] Ubuntu CI leg observed green — verified locally on Windows only; confirm on first push
- [ ] Fixture corpus of sample BizTalk artefacts — **deferred to S02/S05**: there is no parser yet to consume it, so committing fixtures now would be dead weight

## S04 · LLM provider abstraction `P0` — **built, CI-observation pending**

Built `packages/llm`.

- [x] `ILlmProvider` interface (provider-agnostic request/response/usage types)
- [x] `ClaudeProvider` over the Anthropic Messages API, with an injectable fetch so it is testable offline
- [x] `FakeLlmProvider` for deterministic tests and offline runs
- [x] `SkillLoader` + `parseSkill` — YAML frontmatter parser handling inline, folded (`>-`) and CRLF
- [x] 13 BizTalk skill Markdown files ported from upstream as prompt assets, with `skills/NOTICE.md` attribution (MIT)
- [x] No Copilot dependency; **the VS Code LM provider lives in the editor client, not `packages/`** — the headless guard forbids `vscode` in the core
- [x] 22 tests green (llm: 10); no test touches the network
- [ ] Ubuntu CI leg observed green — verified locally on Windows only

---

# Assessment — engines 0–3, no code generation

Scope decision in [ADR-0005](adr/0005-poc-scope-assessment-wedge.md). This phase is the first sellable unit precisely because it does not depend on conversion accuracy.

## S05 · Ingest engine `P0`

- [ ] Accept GitHub repo (app install), folder, zip, MSI
- [ ] MSI decomposition
- [ ] Platform auto-detection with user confirmation
- [ ] Normalised workspace + artefact inventory
- [ ] Parse errors reported per file, never swallowed
- [ ] `cases/` and `workspaces/` confirmed git-ignored

## S06 · IR extension `P0`

- [ ] `targetPlan`: chosen composition, rejected alternatives **with the eliminating constraint**, cost curve, confidence score
- [ ] Volumetrics annotations carrying `measured` / `assumed` provenance
- [ ] Schema validation on read and write
- [ ] Artefact versioning strategy documented
- [ ] Reviewed against the second-target case so it does not become Logic-Apps-shaped

## S07 · Dependency graph + flow grouping `P0`

- [ ] Artefact dependency graph
- [ ] Logical flow-group detection
- [ ] Cross-application reference resolution
- [ ] Graph is queryable and serialisable — it is also the as-is diagram source (S16)

## S08 · Complexity + gap scoring `P0`

- [ ] Per-flow complexity score
- [ ] Severity-ranked gap list
- [ ] Convoys, correlation sets, compensation and custom assemblies flagged for human review
- [ ] Gaps surfaced as a product artefact, not an internal log

## S09 · Volumetrics harvester `P0`

- [ ] `BizTalkDTADb` tracking reader — messages/month per port and orchestration
- [ ] `BizTalkMsgBoxDb` subscription topology reader
- [ ] Average and p95 message size, hourly peakiness, duration, retry/suspend rates
- [ ] Manual-entry model, genuinely usable rather than a fallback
- [ ] Every figure tagged `measured` or `assumed`
- [ ] Read-only DB access; connection strings never persisted to the repo

## S38 · Portability scanner `P0`

Deterministic analysis, not judgement — see [11 · Legacy portability](11-legacy-portability.md). Feeds S10 and S14.

- [ ] Read assembly metadata: target framework version, 32/64-bit
- [ ] Detect COM/COM+ references and P/Invoke declarations
- [ ] Detect references to BizTalk runtime assemblies (`IBaseMessage`, context property bags, ExplorerOM)
- [ ] Detect MSMQ and **MSDTC** usage
- [ ] Detect GAC and strong-name dependencies, and resolve the dependency closure
- [ ] Flag licensed third-party libraries (a commercial blocker, not a technical one)
- [ ] **Assign a portability tier 0–6 automatically** from the evidence
- [ ] Report unresolved dependencies rather than guessing a tier

## S10 · Disposition engine `P0`

- [ ] Label each artefact across the full ladder vocabulary: `retire` / `reuse` / `lift` / `encapsulate` / `remain` / `stay` / `migrate` / `rewrite` / `blocked`
- [ ] Consume the portability tier from S38
- [ ] 12-month traffic evidence attached to each label
- [ ] Duplicate map and dead port detection
- [ ] Runs **before** placement, and its output reduces placement scope
- [ ] **"Cannot migrate" resolves to a named strategy with a cost**, never a gap-list footnote

## S11 · Archetype classifier `P0`

- [ ] Declarative YAML policy covering the 11 archetypes
- [ ] Policy is versioned and customer-tunable
- [ ] LLM fallback for ambiguous flows only
- [ ] Emits candidate **compositions** (trigger + compute + state + exposure), not single services
- [ ] Overrides captured with reasons

## S12 · Rate card client `P0` — **built, CI-observation pending**

Built to [Spec 001 step 2](specs/001-cost-engine.md). `packages/rates`.

- [x] Azure Retail Prices API client, per region and per SKU — `HttpRetailClient`, follows `NextPageLink` to exhaustion
- [x] `LiveRateCard` (fetch + TTL disk cache) and `FixtureRateCard` (disk); `RateCardSource` interface
- [x] Meter catalogue mapping stable keys → feed selectors, with `unitOfMeasure` as the drift tripwire
- [x] **Fails loudly on drift** — a missing meter or a changed unit throws `MeterDriftError` naming the key, never prices as zero. Proven live (caught a 2-row Functions executions meter) and offline (unit-tests)
- [x] Real committed fixture `fixtures/eastus.json`, captured from the live API via `pnpm rates:capture` (11 meters; connector prices exact, WS1 derived to $182.32)
- [x] Corrupted-fixture test throws naming the missing meter (DoD)
- [x] **No test touches the network** — tests use `FixtureRateCard` + offline `buildSnapshot` only (verified by grep)
- [x] 12 tests green (rates: 10)
- [ ] Ubuntu CI leg observed green — verified locally on Windows only
- [ ] **Regression suite with one fixture per billing rule** — deferred to S13, where the billing rules live

## S13 · Cost model + crossover engine `P0`

Constraint in [ADR-0004](adr/0004-llm-never-produces-cost-figures.md): the model never produces a number.

- [ ] `cost(placement, volume, rate_card)` as a pure function
- [ ] Consumption meters every action; **Standard includes built-in service-provider connectors and meters only enterprise connectors**
- [ ] Storage transactions modelled for stateful workflows
- [ ] Cost curves across volume decades, not point estimates
- [ ] Crossover threshold detection where the recommendation flips
- [ ] Unit tests asserting the known crossovers (~17k and ~2.1M msgs/month for the reference flow)
- [ ] No LLM call anywhere in this code path

## S14 · Constraint filter `P0`

- [ ] Message size >256 KB → Service Bus Standard eliminated, claim-check or Premium proposed
- [ ] Ordering → sessions required
- [ ] VNet / private endpoint, latency SLO, transactionality, idempotency
- [ ] X12 / EDIFACT / AS2 → forces Logic Apps Standard + Integration Account
- [ ] Adapter availability (SAP, MQ, HL7), custom .NET assemblies
- [ ] **Framework-target coupling** — Logic Apps local functions are 4.7.2, Functions isolated worker is 4.8; a 3.5/4.0 assembly's retarget decision is constrained by the chosen destination
- [ ] Data residency and compliance
- [ ] Each elimination records **which constraint** removed the candidate

## S15 · Portfolio optimiser `P0`

- [ ] Bin-pack flows onto shared hosts
- [ ] Isolation constraints honoured: blast radius, deploy cadence, scaling profile, security boundary, SLA tier
- [ ] Shared landing zone emitted **once** and referenced by all applications
- [ ] Savings waterfall attributing the delta to retire / share-hosts / stateless / connector-swap
- [ ] Portfolio TCO against the current BizTalk baseline
- [ ] **Hybrid-estate TCO** — retained BizTalk licence, VMs, support and gateway cost for tier 4–5 flows, reported as a named output rather than omitted

## S16 · Architecture Design engine `P1`

- [ ] As-is diagram from the dependency graph
- [ ] Proposed diagram from `placement.json` — **same source graph, so the two are comparable**
- [ ] Landing-zone diagram
- [ ] Per-flow sequence diagrams from the action DAG
- [ ] C4/Structurizr → Mermaid, plus draw.io XML with the Azure icon set
- [ ] Retired artefacts greyed rather than deleted, so reviewers see what was dropped
- [ ] **Topology derived, never model-generated.** LLM contributes labels and narrative only
- [ ] ADR generation for each significant placement

## S17 · Assessment report + traceability `P1` — **G1 gate**

- [ ] Assessment pack: inventory, disposition, placement with priced curves, diagrams, portfolio TCO
- [ ] Traceability matrix: source artefact → decision → evidence
- [ ] Generated continuously off the artefact store, so it is never stale
- [ ] Export to PDF and Word
- [ ] Every cost figure labelled as model output, never as a quotation
- [ ] **Three real applications reviewed by an independent architect who concurs**

---

# Conversion — engines 5–6

## S18 · Emitter framework `P0`

- [ ] Task/Step architecture with SPI-style registration (pattern from `mule-migration-assistant`)
- [ ] Machine-readable gap report for anything it cannot convert
- [ ] Template-first; LLM confined to the tail
- [ ] Adding a target requires no core change

## S19 · Logic Apps Standard emitter `P0`

> **Scope pending [ADR-0006](adr/0006-consume-upstream-converter.md).** If accepted, this stage becomes *"wrap and orchestrate upstream's converter"* and most items below fall away.

- [ ] `workflow.json` and `connections.json`
- [ ] Stateful and stateless variants; **stateless by default where the IR proves no waits and no run-history need**, with the trade-off flagged
- [ ] **.NET Framework 4.7.2 local functions** for lifted assemblies (portability tier 2)
- [ ] **Calling lifted assemblies from inside XSLT maps** — the scripting-functoid path
- [ ] Project scaffolding and `host.json`
- [ ] Mine `BizTalkMigrationStarter`'s `ODXtoWFMigrator` for shape mapping, and upstream's `dotnet-local-functions-logic-apps` skill, rather than re-deriving either

## S20 · Functions + Durable emitter `P0`

- [ ] C# Function project, Flex Consumption configuration, bindings
- [ ] **Isolated worker on .NET Framework 4.8** for lifted legacy assemblies — process isolation prevents 2010-era dependency closures colliding with the host
- [ ] Durable orchestrations and entities for convoy and aggregator archetypes
- [ ] Native-client replacement for enterprise-connector flows — the single biggest cost lever

## S39 · Legacy encapsulation emitter `P1`

Portability tiers 3 and 4 — see [11 · Legacy portability](11-legacy-portability.md).

- [ ] **Tier 3** — Windows container on Container Apps or an AKS Windows node pool, for COM/COM+, 32-bit, P/Invoke and Windows-API components
- [ ] COM registration and GAC installation handled inside the image build
- [ ] **Tier 4** — on-premises exposure via Logic Apps Hybrid, the on-premises data gateway, or a self-hosted API
- [ ] Cost profile per tier, so placement can price encapsulation against a rewrite
- [ ] Parity expectation per tier — a lifted binary should reach higher parity than a rewrite, and the harness should show that

## S21 · Messaging + APIM emitter `P0`

- [ ] Service Bus queues, topics, subscription rules, sessions
- [ ] Claim-check to Blob for messages over 256 KB
- [ ] Event Grid for high fan-out notification
- [ ] APIM OpenAPI definition plus policy XML
- [ ] Routing-only flows emit **no compute at all**

## S22 · Transformation emitter `P0`

- [ ] **Lift plain XSLT verbatim** — cheapest win in the migration
- [ ] `.btm` → Data Mapper `.lml`
- [ ] Liquid where appropriate
- [ ] Scripting functoids extracted to functions
- [ ] Database functoids become explicit lookup steps
- [ ] Anything not convertible lands in the gap report with a reason

## S23 · Golden-pair harvester `P0`

- [ ] Extract input/output message pairs from BizTalk tracking history
- [ ] Same for Mule logs
- [ ] Per-flow storage and indexing
- [ ] **Per-component pairs too**, so a source-less assembly can be characterised behaviourally before it is tiered — this is what makes "we lost the source in 2014" survivable
- [ ] Redaction path for PII before pairs leave the customer environment
- [ ] No customer writes a test case by hand

## S24 · Parity harness `P0` — **G2 gate**

- [ ] Local replay: Functions Core Tools + Azurite + Docker
- [ ] Canonicalisation: namespace prefixes, attribute order, JSON key order, whitespace, timestamps, generated GUIDs, assigned correlation IDs
- [ ] Diff and per-flow parity score
- [ ] Promotion gate blocking below threshold, naming which flows hold the wave
- [ ] Contract tests against generated OpenAPI
- [ ] Schema validation both directions
- [ ] Load smoke test confirming the placement's throughput assumption holds
- [ ] **A published per-flow parity number on real messages**

## S25 · Development engine `P0`

- [ ] Environment-in-the-loop: build and test in a sandbox
- [ ] Branch and PR per flow
- [ ] Failing case + expected + actual fed back as the next iteration's input
- [ ] Single-flow retry/refine without re-running the estate
- [ ] **Cannot promote its own output** — the parity harness decides

---

# MuleSoft as a source

## S26 · MuleSoft parser `P1`

- [ ] Flows and subflows
- [ ] Connector configurations
- [ ] Error-handler hierarchies
- [ ] Property placeholders and environment configs
- [ ] `pom.xml` dependencies
- [ ] MUnit tests (as a golden-pair source)
- [ ] DataWeave extraction into the IR
- [ ] Proves the IR is neutral rather than BizTalk-shaped — if it needs schema changes, say so loudly

## S27 · DataWeave translation `P1` — research, not a feature

- [ ] Harvest payload pairs per transformation
- [ ] Generate a test per pair
- [ ] Translate, then iterate to green
- [ ] Fall back to an emitted C# function and record it in the gap list
- [ ] Publish a convergence rate — the honest measure of how well this works

---

# SaaS

## S28 · Case store + versioning `P0`

- [ ] Typed artefact store, per [ADR-0003](adr/0003-artifact-store-not-chat.md)
- [ ] Every engine writes a versioned artefact plus confidence score and gap list
- [ ] **No engine communicates through chat**
- [ ] Replay from any stage
- [ ] Case fork — "clone at 10× volume"
- [ ] Schema migration path when an artefact shape changes mid-flight

## S29 · Orchestrator + gates + audit `P0`

- [ ] Case state machine on Durable Functions
- [ ] Hard human gates at Placement, Plan, Deployment
- [ ] Audit timeline: approver, timestamp, override reason
- [ ] Override reasons feed back into the placement policy
- [ ] Teams / email notification on gate reached — an unwatched gated pipeline stalls silently

## S30 · Web UI shell `P0`

- [ ] Portfolio dashboard with aggregate TCO vs the BizTalk baseline
- [ ] 8-node stage rail with per-node badges
- [ ] Active node expands: engine, sub-task **in words**, elapsed, live-log link
- [ ] Six states distinguished by **form as well as colour**
- [ ] **`awaiting input` and `awaiting approval` visually distinct from `failed`**
- [ ] SSE/WebSocket live state; resumability after closing the tab
- [ ] Partial artefacts stream as produced
- [ ] Light and dark themes both designed

## S31 · Web UI assessment screens `P0`

- [ ] Load project: GitHub app, upload, on-prem agent, tracking-DB connect
- [ ] Analysis: inventory tree, dependency graph, editable disposition with traffic sparkline
- [ ] Cost validation: volumetrics with `measured`/`assumed` tags, scenario multiplier, placement override dropdowns, live recalculation, blocking constraint chips, savings waterfall
- [ ] Design document: section tree, as-is ↔ proposed toggle, export
- [ ] Inline comments and per-section regenerate

## S32 · Web UI delivery screens `P1`

- [ ] Development board per flow with agent activity stream
- [ ] Verification parity dashboard with canonicalised message diff viewer
- [ ] Deployment: environment matrix, wave planner, IaC diff, shadow-run comparison, rollback
- [ ] Actual-vs-estimated cost chart

## S33 · Multi-tenancy + RBAC `P0`

- [ ] Tenant isolation
- [ ] Authentication
- [ ] Roles: architect, developer, approver, viewer
- [ ] Secret handling via Key Vault
- [ ] VPC / on-premises deployment option for regulated customers
- [ ] Approval gates enforced by role, not by convention

## S34 · Deployment engine `P1`

- [ ] Bicep or Terraform emission
- [ ] CI/CD pipeline generation
- [ ] Wave rollout
- [ ] Shadow / parallel-run comparison against the live BizTalk estate
- [ ] Cutover checklist and rollback

## S35 · FinOps recalibration loop `P1`

- [ ] Ingest Azure Cost Management actuals
- [ ] Ingest Application Insights telemetry
- [ ] Diff against estimate, per flow and per portfolio
- [ ] Recalibrate cost model coefficients
- [ ] Report accuracy trend over time — the number that proves the estimator is improving

---

# Expansion

## S36 · MuleSoft target emitter `P2`

- [ ] Emit Mule flows, connectors and DataWeave from the IR
- [ ] BizTalk → MuleSoft demonstrated end to end
- [ ] Answer the open question first: genuine market, or positioning claim?

## S37 · Additional source parsers `P2` — **G4 gate**

- [ ] TIBCO BusinessWorks
- [ ] Dell Boomi
- [ ] IBM IIB / ACE
- [ ] **Two targets and four sources through one unchanged IR**

---

## Critical path

```
S01 ─→ S02 ─→ S05 ─→ S07 ─→ S11 ─→ S13 ─→ S15 ─→ S17 ─┤G1
       (licence, then everything)     ↑
                          S09 ────────┤ (volumetrics: no cost model without it)
                          S12 ────────┘ (rate card)

S15 ─→ S18 ─→ S19 ─→ S24 ─┤G2 ─→ S25
S17 ─→ S28 ─→ S29 ─→ S30 ─┤G3
```

Three things sit on the critical path and are easy to underestimate: **S01** because it is legal rather than technical and cannot be accelerated by working harder; **S09** because volumetrics require customer database access and therefore a commercial conversation; and **S13** because a cost model with a billing-rule error is worse than no cost model, so it needs a real fixture suite before anyone trusts its output.
