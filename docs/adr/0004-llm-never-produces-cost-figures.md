# ADR-0004 · The language model never produces a cost figure

**Status:** Accepted
**Date:** 26 July 2026

## Context

The Placement & Cost engine is the product's differentiator, and its output — a monthly Azure cost per flow and a portfolio TCO — will be quoted in board papers and used to justify budget.

Language models produce plausible numbers. A cost figure that is wrong but reads credibly is the single worst failure mode available to this product: it will not be caught by a reviewer, it will be repeated, and discovering it later destroys trust in every other number the tool has ever produced.

## Decision

A strict division of labour:

**Deterministic code, always:**
- Rate lookup from the [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices) — per region, per SKU
- Every arithmetic step of the cost model
- Crossover threshold computation
- Bin-packing optimisation
- Parity scoring

**The model, permitted:**
- Classifying flows whose archetype the policy rules cannot determine
- Writing the ADR-style **rationale prose** explaining a decision the policy already made
- Diagram grouping labels and narrative

The model may describe *why* a placement was chosen. It may not compute *what it costs*.

## Related constraints of the same kind

**Diagram topology is derived from the graph, never generated.** The IR dependency graph is the as-is topology; `placement.json` is the proposed topology. An invented edge in an architecture diagram survives review, because diagrams are trusted more than the prose around them.

**Parity verification is deterministic.** The gate cannot be graded by the same kind of system that wrote the code.

## Consequences

**Good.** Output survives a CFO reading it. The cost model is unit-testable with fixtures. Pricing changes are a rate-card update, not a prompt revision.

**Bad.** More engineering than asking a model to estimate. Every new Azure service needs an explicit cost model before it can be a placement candidate — which is a real constraint on how fast the emitter matrix can grow.

**Verification requirement.** Because the model encodes billing *rules* and not just rates, it needs a regression suite with a fixture per rule. Our own first draft charged Logic Apps Standard the same managed-connector rate as Consumption; Standard actually includes built-in service-provider connectors in the plan and meters only enterprise connectors. That single error changed which candidate won at most volumes and was caught only by numerical verification outside the UI.
