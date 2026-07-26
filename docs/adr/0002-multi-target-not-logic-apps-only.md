# ADR-0002 · The target is the whole Azure estate, not Logic Apps

**Status:** Accepted
**Date:** 26 July 2026

## Context

The upstream tool emits Logic Apps Standard only — `workflow.json`, `connections.json`, .NET local functions. It has no representation of the question *"should this be a workflow at all?"*

A real fifty-application BizTalk estate contains flows whose correct Azure home is not a workflow:

- a content-based router belongs in Service Bus subscription rules, with **no compute at all**
- a nightly file sweep belongs in a timer-triggered Function
- an `xref_*` lookup table belongs in Table Storage, not Cosmos DB
- a high-volume SAP feed belongs in a Function with a native client, because managed connector meters at ~$0.001/action make one million messages a month cost ~$1,000 in connector charges alone

Converting all of these into Logic Apps produces a migration that succeeds technically and fails financially, fifty times over.

## Decision

Target the whole Azure estate. Placement is decided per flow by an explicit engine and recorded in a **`targetPlan`** layer on the IR, carrying the chosen composition, the rejected alternatives with their eliminating constraint, the priced cost curve, and a confidence score.

Emitters: Logic Apps Standard (stateful and stateless), Functions and Durable Functions, Service Bus and Event Grid topology, API Management (OpenAPI + policy), Data Mapper `.lml` / XSLT / Liquid, Bicep or Terraform, CI/CD pipelines.

## Consequences

**Good.** This is the product's differentiator and the reason it can be sold alongside a free Microsoft tool rather than against it. It also makes a second *non-Azure* target (MuleSoft, P4) an emitter problem rather than a re-architecture.

**Bad.** Substantially more emitter surface to build and maintain. Every new Azure service is a new template set, a new cost model, and new parity assertions. Mitigated by sequencing: P1 ships no emitters at all ([ADR-0005](0005-poc-scope-assessment-wedge.md)).

**Design constraint.** Any code that assumes a single emitter, or that treats "generate the workflow" as the terminal step, is wrong and should be rejected in review.
