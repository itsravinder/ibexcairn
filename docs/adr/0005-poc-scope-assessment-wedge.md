# ADR-0005 · The POC contains no code generation

**Status:** Accepted
**Date:** 26 July 2026

## Context

The instinct for a migration product is to prove it can migrate — generate a working Logic App from a real orchestration and demo it. That is also the hardest thing to do well, depends on the unresolved problems in [06 · Hard problems](../06-hard-problems.md), and competes directly with a free Microsoft tool.

Meanwhile the differentiator — deciding *where* each flow belongs and what it costs — depends on none of that.

## Decision

**P1 is engines 0–3 only:** Ingest → Analysis → Placement & Cost → Architecture Design. No emitters, no generated code, no deployment.

Deliverable: an assessment pack — artefact inventory, disposition with traffic evidence, per-flow placement with priced cost curves and crossover thresholds, as-is and proposed architecture diagrams, portfolio TCO against the current BizTalk baseline.

Code generation is P1b, after the assessment wedge is proven.

**Exit criterion:** a stakeholder-ready cost and architecture pack for three representative applications that an **independent architect agrees with**. Not "the tool ran" — someone qualified has to concur with its conclusions.

## Why this ordering

1. **No dependence on conversion accuracy.** The hard fidelity problems cannot sink it
2. **Demoable in one meeting**, and the output is a document rather than a running system needing an Azure subscription
3. **Naturally saleable** as assessment-as-a-service — customers already buy this from consultancies as a manual engagement
4. **Validates the differentiator first.** If architects disagree with our placements, we learn that before building seven more engines on top of a flawed policy
5. **Generates the calibration data** that makes the estimator defensible later

## Consequences

**Good.** Fastest path to revenue and to a defensible claim. Forces the placement policy to be genuinely good, because it is the entire product rather than a preamble to code generation.

**Bad.** A migration product that does not migrate is a harder story for some buyers, and easier for a competitor to dismiss as "just a report". Mitigated by the parity number arriving in P1b — and by being explicit that the report is the deliverable customers currently pay consultancies six figures for.

**Risk.** Assessment-only products can be commoditised by consultancies. The moat is the calibrated cost model plus the fact that the same IR feeds conversion later, so the assessment is not a dead end for the customer.
