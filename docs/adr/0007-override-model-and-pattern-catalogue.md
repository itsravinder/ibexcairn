# ADR-0007 · Override model and pattern catalogue

**Status: PROPOSED — decision not taken.** Recorded so the analysis is not lost; do not implement against it yet.
**Date raised:** 26 July 2026

## Context

The system recommends a placement and a code pattern. Architects will disagree — wanting a different Azure resource, a different pattern, or to hand-write the flow themselves.

A single generic "override" button is the wrong answer in both directions. Unconstrained overrides break the product's guarantees on cost accuracy and parity; friction-heavy overrides make architects feel overruled and they stop using the tool.

**First mitigation, before any override machinery:** most disagreements are the tool failing to explain itself. Show the rationale, the volumetrics used, the alternatives considered and the constraint that eliminated each, *at the point of decision*. Much pushback evaporates when an architect can see that Functions was rejected because the flow has a three-day human approval, not because the tool did not consider it.

## Five kinds of disagreement, needing different machinery

| Kind | Example | Handling |
|---|---|---|
| **Preference** | "We're a .NET shop — Functions even where it costs more" | Legitimate. Reprice, record, proceed. No friction |
| **Constraint we didn't know** | "That system can't accept VNet traffic" · "Data must stay in Germany" | **Most valuable kind.** Our inputs were incomplete. Capture as a *durable constraint* that re-filters every other flow |
| **Policy disagreement** | "Your stateless threshold is wrong for our risk appetite" | Update *their* policy, not this flow. Affects all future cases |
| **Our bug** | Misclassified a convoy as a simple router | Override, plus a bug report and a regression fixture |
| **They're wrong** | Stateless workflow for a three-day approval; Service Bus Standard for 1 MB messages | **Must not comply silently.** Warn hard, or refuse |

That last row matters commercially: a tool that lets you configure something guaranteed to fail in production is worse than no tool, because it launders a bad decision through an authoritative-looking system.

## Proposal

### Three tiers by consequence

- **Free** — already-modelled alternative. Switch, reprice instantly, no approval. A dropdown, not a workflow
- **Costed** — viable but not recommended. Show the delta before commitment (*"+$340/month, +6 engineer-days, parity confidence high → medium"*), require acknowledgement, record who accepted
- **Blocked** — violates a hard constraint. Explicit override with written justification, flow flagged at-risk, and **the parity harness's promise changes**. A small set must be genuinely un-overridable: X12/EDIFACT without an Integration Account does not work, and offering it as a choice is dishonest

### Override scope — the fix for override fatigue

Every override asks *"apply to what?"*: **this flow** · **the N similar flows in this case** · **standing policy for this customer**.

Without this, an architect who disagrees with one recommendation clicks the same override thirty times, concludes the tool does not listen, and abandons it.

### Pattern catalogue

Patterns must be **named, selectable things**, not emergent output of a code generator. A placement becomes `{target composition, pattern}`, each pattern carrying a template, a cost profile and a parity expectation.

An architect who accepts "Function" but rejects a durable fan-out picks "queue-triggered batch" from the catalogue and gets a different template with correctly repriced cost. A pattern outside the catalogue is a **custom pattern**: generate a skeleton plus parity tests, and mark it explicitly *not template-verified*. Guarantees are pattern-scoped, and that must be stated rather than implied.

### "We'll write this one ourselves"

A supported outcome. Mark the flow `manual`, then **keep everything else** — still harvest its golden pairs, still run parity against whatever they hand-write, still include it in the traceability matrix.

Rejecting generated code must not mean losing assurance. This single behaviour turns the most adversarial moment in the product into the moment it proves useful.

### Engineering mechanics

- **Pin overrides to a fingerprint of the flow's IR subtree.** On re-analysis — new source drop, upstream parser update — an override must not be silently reapplied to a materially changed flow. If the fingerprint moves, mark it *stale, re-confirm*
- **Invalidate downstream.** A placement override makes cost, diagrams, plan, generated code and parity stale. The case store must know the artefact dependency graph so the case reads "recompute needed" instead of displaying an inconsistent mix. This is the payoff for [ADR-0003](0003-artifact-store-not-chat.md)
- **Never let an agent re-plan freely in response to disagreement.** Overrides go through the policy layer. Otherwise two architects giving identical feedback get different architectures and nothing is reproducible

### The override log is two assets

**Compliance** — actor, timestamp, reason, cost delta, tier. When someone asks in a year why flow #217 costs $1,200/month, the record shows an architect chose it against recommendation, protecting both their governance and us.

**Product** — aggregated across customers, *"78% override our ADF recommendation for batch file movement"* means the default policy is wrong. Per customer, their override history *becomes* their policy. A second learning loop alongside FinOps recalibration, which is why capturing the **reason** matters more than capturing the change.

## If accepted, what changes

Override model and fingerprint pinning in **S13/S15** · pattern catalogue in **S18** · `manual` flow handling in **S23/S24** · staleness and invalidation in **S28** · override log surfaces in **S29/S31**.

## Why it is still open

It adds meaningful scope to five stages and introduces a pattern catalogue as a maintained asset with its own cost and parity metadata. Worth confirming the shape before that scope lands.
