# Ibex Cairn

**An integration migration platform that decides *where* each flow belongs in Azure — priced — before generating any code.**

> A cairn marks a proven route so everyone who follows crosses safely. The first traverse of a legacy integration estate is expensive; every one after it should follow the markers.

---

## The problem

The hard part of moving a fifty-application BizTalk estate to Azure is not rewriting the orchestrations. It is deciding, per flow, which Azure service it should become — and being able to defend that decision with a number.

Every existing tool in this market treats migration as *translation*: read the source artefact, emit the equivalent target artefact. That framing quietly assumes the target is already chosen. In practice a real estate contains:

- a content-based router that should become three Service Bus subscription rules and **no compute at all**
- a nightly file sweep that should become a timer-triggered Function, not a workflow
- a partner EDI exchange that has **no option** other than Logic Apps Standard with an Integration Account
- a high-volume SAP feed whose Azure bill differs by three orders of magnitude depending on whether it runs through a managed connector or a native client

Translate all of those into Logic Apps and the migration succeeds technically and fails financially.

## The inversion

Ibex Cairn reverses the usual order of operations:

1. **Decide and price the placement first** — archetype, constraints, live rate card, portfolio bin-packing
2. **Generate code second** — multi-target, template-first, LLM only for the long tail
3. **Prove behavioural parity before anything is promoted** — golden-message replay with a published per-flow score

## Scope

| Direction | Priority |
|---|---|
| BizTalk → Azure (the whole Azure estate, not Logic Apps alone) | 1 |
| MuleSoft → Azure | 2 |
| BizTalk → MuleSoft | 3 — reachable only because the IR is genuinely platform-neutral |

## Status

**Pre-S01.** Research and architecture documentation only — no implementation has started.

The build is broken into **38 stages across six phases** ([docs/10-stages.md](docs/10-stages.md), tracked in [`STAGES.csv`](STAGES.csv)) with five sign-off gates:

| Gate | Exit criterion |
|---|---|
| **G0 Foundation** | A headless CLI produces valid `ir.json` from a real BizTalk project, no `vscode` dependency |
| **G1 Assessment** | A cost and architecture pack for three real applications that an *independent architect agrees with* |
| **G2 Conversion** | A published per-flow parity number on real golden messages |
| **G3 SaaS** | A customer completes a wave without our team touching their environment |
| **G4 Expansion** | Two targets and four sources through one unchanged IR |

**S01 blocks everything**: a licence review of the upstream project we intend to fork. See [ADR-0001](docs/adr/0001-fork-logicapps-migration-agent.md).

## Documentation

| Doc | Contents |
|---|---|
| [00 · Vision](docs/00-vision.md) | Thesis, positioning, what is actually being sold |
| [01 · Landscape](docs/01-landscape.md) | Prior art and competitive research, with sources |
| [02 · Architecture](docs/02-architecture.md) | Hub-and-spoke design, the IR, fork strategy |
| [03 · Placement & Cost engine](docs/03-placement-cost-engine.md) | The differentiator — six steps, decision matrix, cost levers |
| [04 · Engine topology](docs/04-engine-topology.md) | The ten engines, their contracts, orchestration |
| [05 · UI blueprint](docs/05-ui-blueprint.md) | Screens and the stage rail specification |
| [06 · Hard problems](docs/06-hard-problems.md) | Fidelity risks ranked, with mitigations |
| [07 · Verification](docs/07-verification.md) | Golden replay, parity scoring, shadow running |
| [08 · Roadmap](docs/08-roadmap.md) | Phases with exit criteria, risks, open questions |
| [09 · Naming](docs/09-naming.md) | Name decision, trademark collisions, outstanding legal work |
| [10 · Stages](docs/10-stages.md) | **38 stages with per-stage checklists and phase gates** |
| [`STAGES.csv`](STAGES.csv) | Machine-readable stage tracker — status, dependencies, commit hashes |
| [ADRs](docs/adr/) | Architecture decision records |
| [Dossier](docs/dossier.html) | The full illustrated brief, including a working cost calculator |

The dossier is a self-contained HTML page — open it in a browser. It includes two interactive prototypes: a cost-vs-volume calculator whose recommendation visibly flips at the crossover points, and the stage-rail status component.

## The one-line differentiator

Microsoft ships a free, open-source tool that converts BizTalk to Logic Apps. Ibex Cairn decides **which Azure service each flow should be**, proves the conversion behaves identically, and tells you what it will cost to run — none of which that tool attempts.
