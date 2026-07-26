# Architecture decision records

Short records of decisions that were genuinely contested — each has a rejected alternative and consequences we accepted knowingly. If a future change reverses one of these, add a new ADR superseding it rather than editing the original.

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-fork-logicapps-migration-agent.md) | Fork `Azure/logicapps-migration-agent` rather than build parsers from scratch | Accepted — **pending licence verification (P0 blocker)** |
| [0002](0002-multi-target-not-logic-apps-only.md) | The target is the whole Azure estate, not Logic Apps | Accepted |
| [0003](0003-artifact-store-not-chat.md) | Engines communicate through versioned typed artefacts, never chat | Accepted |
| [0004](0004-llm-never-produces-cost-figures.md) | The language model never produces a cost figure | Accepted |
| [0005](0005-poc-scope-assessment-wedge.md) | The POC contains no code generation | Accepted |

## Format

Context → options considered → decision → consequences (good, bad, and any blocking follow-up). Keep them short enough to read in two minutes.
