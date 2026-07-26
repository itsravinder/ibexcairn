# ADR-0001 · Fork Azure/logicapps-migration-agent rather than build parsers from scratch

**Status:** Accepted, **pending licence verification** — this is the P0 blocker
**Date:** 26 July 2026

## Context

Microsoft open-sourced [Azure/logicapps-migration-agent](https://github.com/Azure/logicapps-migration-agent) in 2026 — a VS Code extension containing a registry-based parser architecture, a platform-neutral intermediate representation whose vocabulary already spans eight integration platforms, a complete BizTalk parser, and 13 Markdown skill files per platform.

Rebuilding a BizTalk parser (`.odx`, `.btm`, `.btp`, `.xsd`, bindings) and designing a neutral IR from first principles would consume most of a year and arrive at something similar.

## Options considered

**A · Fork and extend.** Reuse the parsers, IR and skills; add what is missing.

**B · Build a proprietary hub-and-spoke IR from scratch.** Full control, no upstream dependency, no licence question — but a much larger build, and we would be reinventing a schema Microsoft already reconciled across eight platforms.

**C · Hybrid** — own IR informed by theirs, using their published mapping tables and IR examples as domain knowledge while keeping the engine independent.

**D · Contribute upstream as a built-in parser.** Rejected quickly: a commercial product cannot depend on someone else's merge cycle, and external parser plugins reach only the Discovery stage by Microsoft's own documentation.

## Decision

**Option A.** Fork and extend, with three structural changes made immediately on forking:

1. Lift `src/parsers/**` and `src/ir/**` into a standalone TypeScript library with **zero `vscode` imports**
2. Replace the VS Code Language Model API with an `ILlmProvider` abstraction over the Claude API
3. Extend the IR with a `targetPlan` layer so target choice becomes data rather than an implicit property of the emitter

## Consequences

**Good.** Removes roughly half the build. The IR's `sourceMapping` / `targetMapping` isolation and eight-platform vocabulary are better than we would have designed unaided. The 13 skill files are plain Markdown and survive the move off Copilot untouched.

**Bad.** We inherit an IR with a Logic Apps bias in its `targetMapping`, which `targetPlan` works around rather than fixes. Upstream is in preview and may change shape. We carry an ongoing decision about whether to track upstream or diverge.

**Blocking.** The upstream licence must permit a commercial fork. Until that is confirmed in writing, **no implementation work should start** — if the answer is no, Option C becomes the fallback and the architecture documents remain valid but the parser build returns to scope.

## Follow-up

- [ ] Read the upstream `LICENSE` and any contributor/usage terms
- [ ] Formal opinion on commercial redistribution of a fork
- [ ] Spike: extract `src/parsers` + `src/ir` with no `vscode` imports, prove it produces valid `ir.json` headlessly
