# 04 · Engine topology

## The principle everything depends on

**Engines communicate through versioned, typed artefacts in a case store — never through chat.**

Each engine reads named artefacts and writes its own, like a build pipeline. Agents passing prose to one another cannot be reproduced, diffed or audited, and that is the difference between a product and a demo. See [ADR-0003](adr/0003-artifact-store-not-chat.md).

Every engine emits its artefact plus a **confidence score and a gap list**. Because artefacts are versioned, a case can be replayed or forked — *"clone this at ten times the volume"* — without re-running the expensive stages.

## The ten engines

| # | Engine | Nature | Consumes | Produces |
|---|---|---|---|---|
| 0 | **Ingest** | deterministic | GitHub repo, folder, zip, MSI | Normalised workspace, platform detection, artefact inventory |
| 1 | **Analysis** | hybrid | Workspace | `ir.json`, dependency graph, complexity and gap scores, disposition, archetype per flow |
| 2 | **Placement & Cost** | deterministic + policy | `ir.json`, volumetrics, rate card | `placement.json` — composition, alternatives, cost curve, crossover thresholds; `tco.json` |
| 3 | **Architecture Design** | hybrid | `ir.json`, `placement.json` | As-is, proposed and landing-zone diagrams; sequence diagrams; ADRs |
| 4 | **Planning** | agentic | All of the above | Wave plan, task breakdown, effort, risk register → **approval gate** |
| 5 | **Development** | agentic, environment-in-loop | Approved plan | Generated project, one branch and PR per flow, built and tested in a sandbox |
| 6 | **Verification** | deterministic | Generated code + golden messages | Per-flow parity score, contract tests, promotion gate |
| 7 | **Deployment** | hybrid | Verified artefacts | Bicep/Terraform, CI/CD, wave rollout, shadow run, cutover and rollback |
| 8 | **Documentation** | agentic, **continuous** | The whole artefact store | Assessment report, ADRs, traceability matrix, runbooks, handover pack |
| 9 | **Orchestrator / Case Manager** | state machine | — | Stage transitions, approval gates, audit log, artefact versioning, replay and fork |

Plus a **FinOps feedback loop**: post-wave, ingest Azure Cost Management actuals and Application Insights telemetry, diff against estimate, recalibrate the estimator.

## Two engines that were not on the original list

**Verification (6)** is load-bearing. Without a parity number nobody trusts generated integration code, and the product reduces to a code generator with good marketing.

**Documentation (8)** is deliberately **not a stage**. It runs continuously off the artefact store, so the assessment report and traceability matrix are never stale — which matters because those documents are what the customer actually pays for in the assessment phase.

## Flow and gates

```
0 Ingest
  → 1 Analysis
    → 2 Placement & Cost
      → ▓ GATE · architect approves placement
        → 3 Architecture Design
          → 4 Planning
            → ▓ GATE · sponsor approves plan
              → 5 Development
                → 6 Verification ──parity below threshold──→ back to 5
                  → ▓ GATE · approver authorises release
                    → 7 Deployment
                      → FinOps loop ──recalibrate──→ back to 2

8 Documentation runs continuously, reading everything
9 Orchestrator owns transitions, gates and versioning
```

Three hard human approval gates: **Placement**, **Plan**, **Deployment**. These are product features, not friction — an unattended pipeline that provisions Azure resources and rewrites integration code is not something an enterprise will buy.

## Orchestration

A case-level state machine with engines as workers, implemented on **Durable Functions**. Beyond being the right tool for the job, it means the platform runs on the same services it recommends — which is the most persuasive reference architecture available in a sales conversation.

The Claude API sits behind an `ILlmProvider` abstraction so the agentic engines are not coupled to a vendor or to a developer's IDE subscription.

## Long-running-run affordances

Engines run for minutes to hours, so the platform needs:

- **Live state** over SSE or WebSocket
- **Resumability** — closing the tab and returning shows a truthful picture, because the UI is a pure projection of the artefact store
- **Notification** on gate reached, via Teams or email. A human-gated pipeline that nobody is watching stalls silently
- **Partial artefact streaming** as work is produced, rather than appearing only on completion

## Cross-cutting surfaces to build early

**Case audit timeline** — who approved what, when, and with what override reason. Rejection reasons feed back into the placement policy so the product learns from being wrong, and the same record is the compliance evidence regulated customers require.

**Case fork** — "clone this at ten times the volume". Nearly free given versioned artefacts, and the feature architects will demo to each other.

**RBAC** — architect, developer, approver, viewer. Approval gates are meaningless without it.
