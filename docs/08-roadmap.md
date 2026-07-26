# 08 · Roadmap

Phased on **exit criteria, not dates**. The important decision is in P1: the first sellable unit contains no code generation at all.

## P0 · Spike and due diligence

- Confirm the upstream licence permits a commercial fork — see [ADR-0001](adr/0001-fork-logicapps-migration-agent.md). **This gates everything below.**
- Run the upstream BizTalk sample end to end
- Prove `src/parsers` and `src/ir` lift cleanly out of `vscode`
- Catalogue the 13 skill files and assess how much survives the move off Copilot

**Exit** · a headless CLI produces valid `ir.json` from a real BizTalk project, with no VS Code dependency.

## P1 · Assessment — engines 0–3 only

Ingest → IR → disposition and archetypes → priced placement with cost curves and crossover thresholds → as-is and proposed diagrams → assessment report.

Deliberately first because it delivers value with **zero dependence on conversion accuracy**, demos in a single meeting, and is a natural paid entry point as assessment-as-a-service. See [ADR-0005](adr/0005-poc-scope-assessment-wedge.md).

**Exit** · a stakeholder-ready cost and architecture pack for three representative applications that an independent architect agrees with.

## P1b · Conversion — engines 5–6

Multi-target emitters plus the replay harness, for the same three applications.

**Exit** · a published per-flow parity number on real golden messages.

## P2 · MuleSoft as a source

Real Mule parser replacing the upstream stub: flows, subflows, connector configs, error-handler hierarchies, property placeholders and environment configs, `pom.xml`, MUnit tests, DataWeave extraction. DataWeave translation with auto-generated tests.

A second source platform is what proves the IR is genuinely neutral rather than BizTalk-shaped.

**Exit** · a Mule application through the full pipeline at comparable parity.

## P3 · SaaS

Server-side engine, tenant isolation, repo ingest, case store, run history, RBAC, approval gates, the web UI, pricing model. Engines 4, 7, 8 and 9 land here.

**Exit** · a customer completes a wave without anyone from our team touching their environment.

## P4 · Expansion

MuleSoft **target** emitter, unlocking BizTalk → MuleSoft and proving the hub-and-spoke claim. Then TIBCO, Boomi and IIB parsers — upstream already publishes IR examples for all three as templates.

**Exit** · two targets and four sources through one unchanged IR.

## Risks carried

- **Fidelity ceiling.** Convoys, correlation sets and compensation set a hard automation limit. The product must be honest about it in the UI, not just in the sales conversation
- **DataWeave has no prior art.** Budget as research, gate behind generated tests
- **Microsoft owns the destination and ships a free tool.** They can absorb any pure-conversion advantage. Lead with placement, economics and assurance
- **Volumetrics access is a sales dependency.** Best output requires the customer's tracking database. The manual-entry path must be genuinely good, not a fallback that feels like a downgrade
- **Cost model drift.** Azure pricing and SKUs change; the rate-card client needs its own regression suite

## Open questions

| Question | Why it matters |
|---|---|
| Upstream licence terms | Gates the entire fork strategy. P0 blocker |
| Pricing model — per application, per flow, per assessment, or a share of measured savings? | The last is the most aligned with the value delivered and the hardest to administer |
| Logic Apps Hybrid / on-premises targets in P1, or defer? | Changes the emitter matrix and the monitoring story — OpenTelemetry rather than Application Insights |
| Is BizTalk → MuleSoft a genuine market or a positioning claim? | Determines whether the IR-neutrality investment pays for itself |
| Marketplace and co-sell path with Microsoft | Affects naming, framing, and whether we are a partner or a competitor. Related: never use Microsoft marks in product naming ([09 · Naming](09-naming.md)) |

## Immediate next actions

1. **Legal** — upstream licence review, plus trademark clearance for "Ibex Cairn" in classes 9 and 42
2. **Technical** — clone upstream, run the BizTalk sample, attempt the `vscode` extraction spike
3. **Commercial** — find one friendly BizTalk estate willing to grant tracking-database access for a P1 pilot
