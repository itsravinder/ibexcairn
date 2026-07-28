# 06 · Hard problems

Stated openly, because a migration tool that hides these loses the customer at the first orchestration it mangles. Severity is **fidelity risk**, not effort.

## Critical — no clean solution exists anywhere in the market

### Correlation sets, parallel convoys, dehydration

Microsoft states plainly that these have **no one-to-one Logic Apps equivalent**. They are BizTalk engine semantics, not workflow shapes — the MessageBox subscribes, correlates and rehydrates in ways a declarative workflow does not model.

**Mitigation.** Decompose orchestrations into smaller independently testable units. Service Bus sessions plus `CorrelationId` for grouping; Durable entities for aggregation. **Flag every instance for human design review — never auto-convert silently.** A convoy converted wrongly produces intermittent, load-dependent message loss, which is the worst possible failure mode because it passes acceptance testing.

### DataWeave translation

**No DataWeave → XSLT or → Liquid converter exists anywhere.** DataWeave is a full functional language with higher-order functions, pattern matching and custom modules. This is language translation, not table lookup.

**Mitigation.** Treat it as translation with generated tests: harvest real input/output payload pairs from Anypoint logs, generate a test per pair, translate, iterate until green. Where it cannot converge, emit a C# function and say so explicitly in the gap list. Budget this as **research, not a feature**.

### Transactions and compensation

BizTalk long-running transactions with compensation blocks have no direct analogue. Correctness failures here are silent and expensive.

**MSDTC specifically.** 2010-era BizTalk leans heavily on distributed transactions across MSMQ, SQL Server and the MessageBox. Azure has no equivalent at all, so every such flow is a redesign rather than a conversion — and this is the single most common reason a flow ends up at tier 5 or 6 of the [portability ladder](11-legacy-portability.md).

**Mitigation.** Emit an explicit saga design per case for human approval. Never generate compensation logic without a parity test that exercises the **failure** path, not just the happy path.

## High

### Custom .NET pipeline components and assemblies

Often source-less; behaviour observable only through the binary. Frequently the load-bearing business logic nobody documented.

**Downgraded from critical after verification.** The framework version turns out not to be the blocker — Logic Apps Standard can call .NET Framework 4.7.2 assemblies unchanged (including from inside XSLT maps), and Azure Functions isolated worker supports 4.8 with process isolation. Most 2010-vintage assemblies are therefore **lifted, not rewritten**.

**Mitigation.** Assign a tier from the portability ladder in [11 · Legacy portability](11-legacy-portability.md): lift the binary (tier 2), containerise on Windows (tier 3), or expose it from on-premises via Hybrid or the data gateway (tier 4). Characterise source-less assemblies with golden pairs from tracking history, confirmed by decompilation, before deciding. A working black box beats a broken rewrite.

**What actually blocks** is Windows-platform coupling, not the framework: COM/COM+, 32-bit native DLLs, P/Invoke, MSMQ, and references to BizTalk runtime APIs (`IBaseMessage`, context property bags, ExplorerOM) which have no equivalent because there is no MessageBox.

### Scripting functoids and complex maps

Inline C#, XSLT call-templates and database-lookup functoids embedded inside a visual map.

**Mitigation.** **Lift plain XSLT verbatim — the cheapest win available in the whole migration.** Extract scripting functoids to functions. Database functoids become explicit lookup steps against Table Storage or SQL.

### MessageBox publish/subscribe semantics

Property promotion plus filter subscriptions is a routing *model*, not a pipeline, and has no single Azure counterpart.

**Mitigation.** Service Bus topics with subscription rules; promoted properties become message properties. Usually **cheaper** than the original, because routing stops consuming compute entirely.

## Moderate

### EDI and trading-partner configuration

High volume of fiddly configuration — agreements, envelopes, control numbers, partner identities.

**Mitigation.** Mechanical migration into one shared Integration Account. Tedious rather than risky, which makes it a good automation target and an easy early win.

### Model non-determinism

The same input can produce different code across runs, which is unacceptable in an audited migration.

**Mitigation.** Deterministic scaffolding constrains the search space; parity gates catch the rest; every generation is versioned and diffable against its predecessor. See [ADR-0004](adr/0004-llm-never-produces-cost-figures.md) for the related constraint on cost figures.

### Cost model drift

Azure pricing, SKUs and billing rules change. Our own first draft got Logic Apps Standard connector billing wrong — Standard includes built-in service-provider connectors in the plan and meters only enterprise/managed connectors, which materially changed which candidate won.

**Mitigation.** The rate-card client and the crossover thresholds need their own regression tests, with a fixture per billing rule. Without them the tool will quietly start lying, and a cost tool that lies is worse than no cost tool.

## What we tell customers

The fidelity ceiling is real and it is set by the three critical items above. The product's honesty about them **in the UI**, not just in the sales conversation, is a feature: a gap list with "this convoy needs a human design decision" is trustworthy, and a tool that silently produces something plausible is not.
