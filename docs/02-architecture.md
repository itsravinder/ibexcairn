# 02 · Architecture

**Hub-and-spoke, deterministic-first, verification-gated.** Sources fan into one intermediate representation; the representation fans out to multiple emitters; nothing reaches an environment without passing a parity gate.

```
Ingest (repo / MSI / zip)
   → Parsers (one per source platform, registry-based)
      → IR document (platform-neutral)
         → Analysis (dependency graph · disposition · archetype · gaps)
            → Placement & Cost  ←  volumetrics + live rate card
               → Emitters (multi-target Azure)
                  → Verifier (golden-message replay)  ──fail──┐
                     → Packager (IaC + CI/CD)                 │
                        → Wave deployment                     │
                           → FinOps recalibration             │
                                                              └→ back to Emitters
```

## Six design commitments

Each of these could reasonably have gone the other way, so each is recorded as a decision rather than an assumption.

### 1. The deterministic core leaves VS Code

Fork the upstream repository and lift `src/parsers/**`, `src/ir/**` and the stage logic into a standalone TypeScript library and CLI with **zero `vscode` imports**. The VS Code extension becomes one client; the SaaS API becomes another.

This is the single most important structural move in the plan. Without it there is no SaaS — the engine would remain on a developer's laptop, gated behind a Copilot subscription.

### 2. The Copilot LM API is replaced by a provider abstraction

An `ILlmProvider` interface backed by the Claude API server-side, with the VS Code Language Model API retained as an optional local provider for the desktop client. The 13 Markdown skill files survive the move untouched, because they are plain prompt assets rather than code.

### 3. The IR gains a `targetPlan` layer

Upstream's `targetMapping` describes a Logic Apps destination. We generalise it: per flow and per action, `targetPlan` carries

- the chosen Azure composition (trigger + compute + state + exposure)
- the alternatives considered, and the constraint or cost that eliminated each
- the priced cost curve and crossover thresholds
- a confidence score

Target choice stops being an implicit property of whichever emitter runs, and becomes a reviewable, versioned artefact a human approves. See [ADR-0002](adr/0002-multi-target-not-logic-apps-only.md).

### 4. Placement is an explicit engine with its own approval gate

Not a heuristic buried in a code generator. See [03 · Placement & Cost engine](03-placement-cost-engine.md).

### 5. Emitters are template-plus-LLM, never LLM-alone

Structure comes from templates — the parts that are invariant across every flow. The model fills only what genuinely varies. Targets:

| Emitter | Output |
|---|---|
| Logic Apps Standard | `workflow.json`, `connections.json`, stateful or stateless |
| Functions / Durable Functions | C# project, host config, bindings |
| Service Bus / Event Grid | Topology — queues, topics, subscription rules, sessions |
| API Management | OpenAPI definition plus policy XML |
| Transformations | Data Mapper `.lml`, XSLT (often lifted verbatim), Liquid |
| Infrastructure | Bicep or Terraform |
| Pipelines | Azure Pipelines or GitHub Actions |

### 6. Golden-message replay is a product feature

Not a testing afterthought. See [07 · Verification](07-verification.md).

## The intermediate representation

Adopted from upstream and extended. Eight primary sections — `metadata`, `workflow`, `triggers`, `actions`, `variables`, `connections`, `schemas`, `maps` — plus `messageProcessing`, `endpoints`, `correlation`, `errorHandling`, `rules`, `B2B`, `observability`, `dependencies`, `gaps`, `extensions`, and our added `targetPlan`.

Two properties make it worth adopting rather than replacing:

**Layered isolation.** Platform-specific detail lives in `sourceMapping`, destination detail in `targetMapping` / `targetPlan`. Neither pollutes the core model, which is what allows a second target platform later without a schema rewrite.

**A normalised vocabulary** already reconciled across eight platforms:

| IR concept | BizTalk | MuleSoft | Boomi | IIB / TIBCO |
|---|---|---|---|---|
| `flow` | Orchestration | Mule Flow | Process | Message Flow / Process |
| `action` | Shape | Processor | Shape | Node / Activity |
| `transform` | Map (`.btm`, XSLT) | DataWeave | Map | Mapping node |
| `condition` | Decide | Choice | Decision | Route / Filter |
| `connection` | Adapter + port | Connector | Connector | Input/Output node |

Actions form a directed acyclic graph through `runAfter`, declaring predecessor IDs and required success states. Control structures nest: condition branches, foreach loops, parallel arrays, transactional scopes.

**This vocabulary is what makes BizTalk → MuleSoft reachable**, not just BizTalk → Azure. If the IR were Azure-shaped, the third migration direction would require starting again.

## Fork strategy

| Upstream | Action | Detail |
|---|---|---|
| `src/parsers/biztalk/**` | **keep** | The complete reference implementation, and the pattern every later parser copies |
| `src/ir/**` | **keep + extend** | Adopt the schema wholesale; add `targetPlan` and volumetrics annotations |
| `src/parsers/mulesoft/` (stub) | **replace** | Real parser: flows, subflows, connector configs, error handlers, property placeholders, `pom.xml`, DataWeave extraction |
| `resources/skills/**` (13 per platform) | **keep as assets** | Plain Markdown, so they survive the move off Copilot unchanged |
| `src/copilot/**`, VS Code LM API | **replace** | `ILlmProvider` over the Claude API; VS Code LM API as optional local provider |
| `src/stages/**` | **refactor** | Strip `vscode` imports; re-expose as a library both the SaaS API and the extension call |
| Extension host, webviews, commands | **demote** | Becomes one client of the core, not the home of the engine |
| — | **add** | Placement & Cost engine · rate-card client · policy YAML · volumetrics harvester · multi-target emitters · parity harness · case store · orchestrator · web UI |

Also worth mining rather than reinventing: **BizTalkMigrationStarter**'s three deterministic converters, which are further along on `.odx` shape mapping and `.btm` → Data Mapper than a first pass of our own would be; and **mule-migration-assistant**'s Task/Step architecture with SPI discovery plus its machine-readable gap report, which is the right shape for our emitters.

## Blocking prerequisite

The entire strategy above depends on the upstream licence permitting a commercial fork. That is the P0 gate and it is a legal question, not an engineering one. See [ADR-0001](adr/0001-fork-logicapps-migration-agent.md).
