# ADR-0006 · Consume upstream's converter rather than compete with it

**Status: PROPOSED — decision not taken.** Recorded so the analysis is not lost; do not implement against it yet.
**Date raised:** 26 July 2026
**Decision owner:** project sponsor

## Context

`Azure/logicapps-migration-agent` is free, open source, from Microsoft, and converts BizTalk to Logic Apps Standard. The question it raises is direct: why would anyone pay for ours?

### Where their tool genuinely does not reach

It converts a **project**; a migration is a **programme**. It runs in one developer's VS Code, one project at a time, and emits workflow JSON. With fifty applications the budget-consuming questions are which artefacts not to migrate, which service each flow belongs in, what the estate costs to run, which thirty flows go in wave one, and how to prove flow #217 behaves identically. It answers none of these and has no portfolio concept, no volumetrics, no cost model and no equivalence testing.

Five concrete gaps:

1. **It answers "how", never "whether" or "which".** Logic Apps is a premise rather than a conclusion
2. **No cost model** — and per-action billing surprises are the most common Azure migration horror story
3. **No parity evidence.** Its Validation stage is AI-assisted testing, not replayed golden messages with a published score
4. **Copilot plus VS Code is a hard dependency**, excluding regulated, air-gapped and seat-limited customers
5. **A free preview tool transfers no risk** — no SLA, support, indemnity or roadmap commitment. Enterprises buying a migration are buying accountability

### The structural moat

Their tool is a **product-led growth asset for Logic Apps**. Its purpose is frictionless Logic Apps adoption, so it will never tell a customer *"move this off Logic Apps onto a Function and cut the bill by 90%"* — that sentence is contrary to why it exists.

**This is an incentive asymmetry, not a feature gap**, which makes it a far better moat than out-engineering a platform team.

### Where the moat is thin — stated honestly

- **Multi-target within Azure is not protected by that asymmetry.** Functions, Service Bus and APIM are all Azure revenue, so Microsoft could add "pick the right Azure service" with no conflict. If they do, differentiation narrows to portfolio economics, parity, programme management and accountability
- **Free-and-good-enough threatens the conversion layer specifically.** If their converter keeps improving, our S19–S22 emitters compete with free
- **Assessment-only products get commoditised** by consultancies running their free tool and writing the report by hand

## Proposal

Position Ibex Cairn as the **programme layer that drives their tool**. We own ingest, disposition, placement, pricing, waves, parity and audit. Where a placement resolves to Logic Apps Standard, invoke upstream's converter as a component rather than shipping a competing emitter.

This inverts the largest risk: *"Microsoft improves their converter"* stops being a threat and becomes a free upgrade. Their tool also becomes a lead generator — Microsoft tells every BizTalk customer to migrate and hands them a tool, those customers hit the wall at estate scale, and they come looking for what we sell.

## If accepted, what changes

- **S19** becomes *"wrap and orchestrate upstream's converter"* rather than *"build our own Logic Apps emitter"*, removing scope from the Conversion phase
- **S20–S22 stay ours** — Functions, messaging and transformation targets Microsoft has no incentive to emit
- Positioning language everywhere becomes *"maximise the value of your Azure migration"*, never *"an alternative to Microsoft's tool"*
- We pursue **Marketplace listing and co-sell as a partner**, which reinforces the naming constraint in [09 · Naming](../09-naming.md): never use Microsoft marks in our own product names
- Strengthens [ADR-0005](0005-poc-scope-assessment-wedge.md) — the assessment wedge is precisely the ground their incentives keep them off

## Why it is still open

Committing to consume upstream couples our conversion quality and release cadence to a preview-stage Microsoft project, on top of the licence exposure already flagged in [ADR-0001](0001-fork-logicapps-migration-agent.md). That is a strategic dependency the sponsor should choose deliberately, not a technical detail.

**Blocked on:** S01 licence outcome, and a sponsor decision on partner-versus-competitor positioning.
