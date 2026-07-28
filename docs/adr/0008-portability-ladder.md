# ADR-0008 · Portability ladder and extended disposition vocabulary

**Status:** Accepted
**Date:** 26 July 2026

## Context

A representative estate is BizTalk 2010-vintage code on .NET Framework 3.5/4.0: custom pipeline components, custom functoids, helper assemblies called from orchestration expression shapes, frequently source-less.

The instinct is to treat these as unmigratable and either rewrite them or abandon the flow. Both are expensive, and both are usually unnecessary.

Verification established that **the framework version is rarely the blocker**:

- Logic Apps Standard can call **.NET Framework 4.7.2** assemblies unchanged, including from inside XSLT maps (GA)
- Azure Functions isolated worker supports **.NET Framework 4.8** with process isolation, and Microsoft states there is no plan to end that support

The actual discriminator is **Windows-platform coupling** — COM, 32-bit, P/Invoke, MSDTC, MSMQ, BizTalk runtime APIs — not the target framework.

## Options considered

**A · Binary classification** — migratable or not. Rejected: collapses six materially different strategies with very different costs into one bit, and produces "cannot migrate" as a dead end rather than a decision.

**B · Portability ladder** — seven tiers from retire through rewrite, assigned per component from a deterministic scan.

**C · Rewrite everything not natively supported.** Rejected: most expensive and highest-risk option, applied to code whose behaviour is frequently undocumented.

## Decision

**Option B.** Adopt the seven-tier ladder documented in [11 · Legacy portability](../11-legacy-portability.md), and extend the disposition vocabulary to express it:

`retire` · `reuse` · `lift` · `encapsulate` · `remain` · `stay` · `migrate` · `rewrite` · `blocked`

Three supporting commitments:

1. **A portability scanner** (stage S38) assigns the tier deterministically from assembly metadata — target framework, bitness, COM references, P/Invoke, BizTalk runtime references, MSDTC/MSMQ usage, GAC and strong-name dependencies, licensed third-party libraries
2. **Characterise before tiering.** Source-less assemblies are specified by golden pairs extracted from tracking history, confirmed by decompilation. A lifted binary arrives with parity tests already written
3. **Hybrid-estate TCO is a named output.** Tiers 4 and 5 retain on-premises cost — licence, VMs, support — and that figure must appear in the portfolio TCO rather than being omitted because it is inconvenient

## Consequences

**Good.** Most 2010 code becomes tier 2 — lifted unchanged, cheapest possible path. "Cannot migrate" becomes a named strategy with a price rather than a project blocker. Source-less code stops being fatal. The hybrid TCO is a genuine differentiator that Microsoft's free tool has no incentive to produce.

**Bad.** More emitter surface: Windows containers (tier 3) and gateway-exposed remote calls (tier 4) are additional targets to template, price and parity-test. The scanner needs an assembly-metadata reader, which is real work.

**Constraints this imposes on our own build.**

- **Logic Apps Standard custom-functions tooling is Windows-only.** Generation and build agents cannot be Linux-only — affects S03 and S25
- **Framework targets differ by destination** (4.7.2 for Logic Apps local functions, 4.8 for Functions isolated worker), so the retarget decision is coupled to the placement decision. Belongs in the constraint filter, S14

**Open.** BizTalk Server support lifecycle end dates must be confirmed from Microsoft's lifecycle page. Tier 5 is only defensible until then and the date must not be quoted from memory.
