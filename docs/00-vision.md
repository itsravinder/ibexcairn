# 00 · Vision

## Thesis

Migrating an integration estate is a **placement** problem, not a translation problem.

Every tool in this market reads a source artefact and emits an equivalent target artefact. That framing assumes the target has already been chosen — and for a fifty-application estate, the target choice is worth more than the conversion accuracy. A content-based router belongs in Service Bus subscription rules with no compute at all. A nightly file sweep belongs in a timer-triggered Function. An EDI partner exchange has no option other than Logic Apps Standard with an Integration Account. A high-volume SAP feed's Azure bill varies by three orders of magnitude depending on whether it runs through a managed connector or a native client.

Convert all of those into Logic Apps and the migration succeeds technically and fails financially — fifty times over.

## Order of operations

1. **Disposition** — which artefacts should not be migrated at all
2. **Placement** — which Azure service each surviving flow belongs in, and why
3. **Price** — what each candidate placement costs to run, from a live rate card
4. **Generate** — multi-target code, template-first
5. **Verify** — behavioural parity against real historical messages, scored and gated
6. **Deploy** — waves, shadow running, then cutover
7. **Recalibrate** — actual cost against estimate, feeding back into the model

Steps 1–3 are the product. Steps 4–6 are table stakes that nobody currently does well. Step 7 is what makes it a subscription rather than a project.

## What is actually being sold

| | |
|---|---|
| **Multi-target placement with priced rationale** | The free tool converts to Logic Apps. This one decides where each flow belongs and defends it with a number |
| **Portfolio economics** | Disposition, bin-packing, savings waterfall, TCO against the incumbent baseline |
| **Parity-tested output** | Migration projects don't stall on code generation — they stall in the six months of regression testing afterwards. This removes that |
| **Audit-grade traceability** | Source artefact → generated file → test evidence → approver. Regulated customers require it; nobody supplies it |
| **No Copilot dependency** | Plus a VPC or on-premises deployment option for customers who cannot send source code to a vendor cloud |
| **A calibrated estimator** | Improves with every completed wave. The one asset a later competitor cannot copy |

## Positioning against Microsoft

Microsoft owns the destination platform *and* ships a free, open-source migration tool. Competing on conversion fidelity means competing on their turf, against their roadmap, at a price of zero.

The defensible ground is where they have chosen not to play: **which Azure service, at what cost, with what proof**. Their tool has no concept of target selection, no cost model, and no equivalence testing. Those three absences are the entire product.

Practical consequence: we want to be a Marketplace and co-sell partner, not a competitor. That means never using Microsoft marks in our own product naming, and framing the tool as *maximising the value of an Azure migration* rather than as an alternative to anything Microsoft sells.

## Scope, in order

1. **BizTalk → Azure** — the whole Azure estate
2. **MuleSoft → Azure** — requires replacing an upstream stub parser and solving DataWeave
3. **BizTalk → MuleSoft** — reachable only because the intermediate representation is genuinely platform-neutral rather than an Azure-shaped funnel

The third is what justifies the neutrality investment in the IR. Whether it is a real market or a positioning claim is an open question — see [08 · Roadmap](08-roadmap.md).

## Shape of the business

POC first, then SaaS. The POC is deliberately **engines 0–3 only — assessment, placement, cost and diagrams, with no code generation at all**. It delivers value with zero dependence on conversion accuracy, demos in a single meeting, and is a natural paid entry point as assessment-as-a-service. See [ADR-0005](adr/0005-poc-scope-assessment-wedge.md).
