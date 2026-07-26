# ADR-0003 · Engines communicate through versioned typed artefacts, never through chat

**Status:** Accepted
**Date:** 26 July 2026

## Context

The platform is ten engines, several of them agentic. The obvious implementation — agents handing conclusions to one another as natural-language messages — is how most multi-agent systems are built and is what the upstream tool effectively does through Copilot chat participants.

Prose handoffs cannot be diffed, replayed, or audited. For a product whose output justifies budget decisions and whose customers are frequently regulated, that is disqualifying.

## Decision

Engines read named artefacts from a **case store** and write their own, like a build pipeline. Nothing is passed conversationally.

- Every engine emits its artefact plus a **confidence score** and a **gap list**
- Every artefact is **versioned**
- The UI is a **pure projection** of the artefact store — no separate UI state

Key artefacts: `ir.json` · `placement.json` · `tco.json` · diagrams · plan · generated code · parity results.

## Consequences

**Good.**
- A case can be **replayed** from any stage, or **forked** ("clone at 10× volume") without re-running expensive stages
- Closing the browser tab mid-run is safe, because the UI derives from stored state
- The traceability matrix — source artefact → generated file → test evidence → approver — falls out of the design rather than being bolted on
- Engines become independently testable: given these artefacts in, assert those artefacts out

**Bad.** More upfront design than passing messages around. Requires schema discipline and versioning on every artefact, and a migration story when a schema changes mid-flight.

**Consequence for prompts.** Agentic engines are given artefacts as input and must write artefacts as output. An engine whose useful result exists only in its chat transcript has not done its job.
