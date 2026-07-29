# S01 · Upstream licence review

**Date:** 26 July 2026
**Subject:** [`Azure/logicapps-migration-agent`](https://github.com/Azure/logicapps-migration-agent) — the fork target for [ADR-0001](../adr/0001-fork-logicapps-migration-agent.md)
**Verdict:** ✅ **Standard MIT. A commercial fork is permitted.** Two conditions attach, and both are engineering work rather than legal risk.

> Not legal advice. The licence text was read directly and is unambiguous, but the sponsor should still have counsel glance at it — see *Residual items*.

---

## The licence

`LICENSE`, 1,078 bytes, retrieved from `main`:

> MIT License · Copyright (c) 2026 Microsoft Corporation

**Verbatim, unmodified MIT.** Verified by reading the full text, not by trusting GitHub's badge. It grants, without restriction, the rights to *use, copy, modify, merge, publish, distribute, sublicense, and/or sell* copies.

Equally important is what is **absent**:

- No additional rider or supplemental terms
- No field-of-use restriction, and no non-commercial clause
- No trademark section — unusual for a Microsoft repository, many of which add one
- No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` or `NOTICE` imposing further conditions. Only `LICENSE`, `README.md` and `SECURITY.md` exist
- The README's entire licence statement is one line: *"MIT License — see LICENSE for details."*

`package.json` independently declares `"license": "MIT"`, consistent with the file.

### What this means

The central question of ADR-0001 — *may we fork this commercially?* — is **yes**. Sublicensing and selling are expressly granted. ADR-0001 moves from *Accepted pending licence verification* to **Accepted**, and **S02 is released for engineering.**

## Obligations we take on

| Obligation | Practical effect |
|---|---|
| **Retain the copyright and permission notice** in copies or substantial portions | Ship a `THIRD-PARTY-NOTICES` file carrying Microsoft's MIT notice. An ongoing compliance task, not a one-off |
| **No trademark licence.** MIT grants copyright rights only | We cannot market using *Microsoft*, *Azure* or *Logic Apps* branding. Reinforces the naming rule in [09 · Naming](../09-naming.md) — and this is now a licence point, not merely positioning |
| **No patent grant.** MIT is silent on patents, unlike Apache 2.0 | Low practical risk, but a genuine distinction worth a lawyer's note |
| **"AS IS", no warranty, no indemnity** | We are selling *accountability* to enterprises, so we indemnify our customers while nobody indemnifies us for the upstream code. A pricing and insurance consideration, not a blocker |

## Two conditions that become S02 scope

Both discovered by inspecting `package.json`, and both are material.

### 1 · Telemetry must be stripped

Runtime dependencies include **`@vscode/extension-telemetry`** and **`@microsoft/applicationinsights-common`**. The upstream tool reports telemetry to Microsoft.

Our fork targets regulated customers who cannot send source code to a vendor cloud, and for whom a VPC or on-premises deployment is a purchase condition. **Metadata about a customer's BizTalk estate flowing to a third party is a dealbreaker for exactly the buyers we are courting.** Removing both dependencies, and proving they are gone, is a hard requirement of the extraction — not a cleanup task for later.

### 2 · A proprietary extension dependency must be severed

```json
"extensionDependencies": ["ms-azuretools.vscode-azurelogicapps"]
```

The upstream extension hard-depends on the **Azure Logic Apps VS Code extension**, which is *not* MIT — it is Microsoft-licensed marketplace software. MIT on this repository does not extend to it.

This is a second, independent argument for the headless extraction already planned in S02: the library must not inherit a dependency on closed marketplace software. It also means the VS Code client path carries a proprietary dependency the SaaS path does not.

## Dependency licences — scan still required

MIT on the repository says nothing about its dependency tree. The direct runtime set is small and conventionally permissive:

`@azure/arm-logic` · `@azure/arm-resources` · `@azure/identity` · `@microsoft/applicationinsights-common` · `@vscode/extension-telemetry` · `@xmldom/xmldom` · `docx` · `fast-xml-parser` · `immer` · `mermaid` · `xstate`

No copyleft is apparent, but **licences must be verified rather than assumed** — run `pnpm licenses list` (or `license-checker`) across the transitive tree and gate it in CI. A single copyleft transitive dependency would be a far bigger problem than the repository licence ever was.

## Incidental findings worth keeping

- **`mermaid` and `docx` are already runtime dependencies** — upstream is generating diagrams and Word documents today. Directly relevant to S16 and S17; less to build than assumed
- **`xstate`** — upstream models its stage workflow as a state machine. Worth studying before designing the S29 orchestrator
- **`engines: { pnpm: ">=9" }`** — upstream is a pnpm project, matching the choice in [Spec 001](../specs/001-cost-engine.md). Toolchains align
- **Version 1.9.0**, publisher `ms-azuretools`

## Project maturity — a dependency risk, not a licence risk

Created **4 May 2026**, last pushed 17 July 2026, **6 stars and 7 forks**.

Very new, and adoption is negligible. The licence is safe; the *project* is not proven. It may change shape substantially or be abandoned. This does not block the fork — MIT means we keep what we take — but it strengthens the case for the fork being a genuine fork we own rather than a tracked upstream dependency, and it is directly relevant to the still-open [ADR-0006](../adr/0006-consume-upstream-converter.md), whose whole premise is depending on this project's converter.

## Residual items

- [ ] **Counsel glance** at the MIT terms and the attribution mechanics. For unmodified MIT this is close to a formality, so a short review rather than a full engagement should suffice
- [ ] **Transitive dependency licence scan**, gated in CI — the real remaining exposure
- [ ] Confirm the *Azure preview supplemental terms* referenced in Microsoft's documentation attach to the **hosted service and marketplace extension**, not to source distributed under MIT. They appear on the Learn pages, not in the repository
- [ ] Sponsor sign-off recorded on ADR-0001

## Recommendation

**Proceed with the fork.** Begin S02 as a technical spike now; obtain the counsel glance and the dependency scan before anything ships. The licence is the most permissive outcome that was realistically available, and the two conditions uncovered — strip telemetry, sever the proprietary extension dependency — are things we wanted to do anyway for the SaaS architecture.
