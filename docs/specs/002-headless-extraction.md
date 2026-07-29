# Spec 002 · Headless core extraction (S02)

**Status:** spike complete, implementation ready
**Depends on:** S01 ✅ (MIT confirmed) and **S03 scaffold** — there must be a monorepo to extract *into*
**Upstream base commit:** `4b08eb8ceff95aeef48def73205e04586afdb4e5` (v1.9.0, `main`, sparse-cloned 26 July 2026)

---

## Spike findings — measured, not assumed

126 TypeScript files, **63,460 lines**. The question was whether `parsers/` and `ir/` detach from the extension host. Answer: **yes, mechanically.**

### `vscode` coupling by directory

| Directory | Files importing `vscode` | Lines | Verdict |
|---|---|---|---|
| `parsers/` | **18 / 29** | 14,501 | **Lift** — coupling is shallow, see below |
| `ir/` | **1 / 21** | 9,361 | **Lift** — one file to fix |
| `types/` | 0 / 5 | 1,012 | **Lift as-is** |
| `constants/` | 0 / 2 | 910 | **Lift as-is** |
| `workflowSchema/` | 0 / 3 | 667 | **Lift as-is** |
| `stages/` | 12 / 18 | 8,875 | Replace — genuinely UX-coupled |
| `services/` | 14 / 20 | 7,013 | Replace |
| `copilot/` | 1 / 3 | 5,409 | Replace with `ILlmProvider` (S04) |
| `views/` | 5 / 8 | 10,820 | Drop — webviews |
| `ui/` | 4 / 6 | 1,794 | Drop |
| `commands/` | 1 / 2 | 1,722 | Drop |
| `errors/` | 1 / 8 | 982 | Selectively lift |

**Lift ≈ 26,451 lines (42%).** The 58% we replace is what we were always going to replace.

### Why 18-of-29 was a misleading headline

The `parsers/` coupling is almost entirely **one type**:

```
19 × vscode.CancellationToken     ← type-only, in optional parameters
 2 × vscode.Extension             ┐
 2 × vscode.Disposable            ├─ all in ParserPluginLoader.ts
 3 × vscode.extensions.*          ┘
```

Precisely: **16 of the 18 files use *nothing* but `vscode.CancellationToken`**, appearing as `cancellationToken?: vscode.CancellationToken` in `AbstractParser` and each BizTalk parser's options object.

The two exceptions:
- **`ParserPluginLoader.ts`** — the only consumer of `vscode.extensions.*`. It discovers *other VS Code extensions* that register parsers. **Meaningless headless: delete it.**
- **`parsers/types.ts`** — imports `vscode` but references no `vscode.*` member. A stale or type-only import; drop the line.

`ir/`'s single coupling is **`src/ir/storage/IRStorage.ts`**, which persists via `workspace.fs`.

### Telemetry is trivially isolated

Every telemetry reference lives in exactly one file: **`src/services/TelemetryService.ts`**. Deleting it and the two dependencies satisfies the S01 obligation cleanly. Verify with a grep gate in CI rather than by inspection.

---

## ⚠️ Windows long paths — a real blocker, found the hard way

**Upstream cannot be cloned on Windows with default git settings.** Paths under
`resources/referenceDocs/LogicApps_Standard_Docs/05 - Develop and Author Workflows/…`
exceed the 260-character `MAX_PATH` limit. A plain `git clone` fails part-way with `Filename too long` and leaves a broken tree.

This matters because [ADR-0008](../adr/0008-portability-ladder.md) mandates **Windows build agents**.

Working combination, used for the spike:

```bash
git -c core.longpaths=true clone --depth 1 --sparse <url> lama
cd lama
git -c core.longpaths=true sparse-checkout set src resources/skills resources/agents docs
```

Two things to note: `sparse-checkout set` takes **directories only** — passing `package.json` fails with *"not a directory"* — and the fork should either enable `core.longpaths` repo-wide or shorten those reference-doc paths outright. **We are forking, so shortening them is the better fix** and removes the trap for every future clone.

Action: add `core.longpaths` setup to the Windows CI job in S03, and record it in the fork's README.

---

## Implementation plan

### Step 1 · Fork and pin

- [ ] Fork upstream; record base commit `4b08eb8` in `docs/specs/002-headless-extraction.md` and in the fork README
- [ ] **Shorten the `resources/referenceDocs/**` paths** so the repo clones on Windows without `core.longpaths`
- [ ] Ship `THIRD-PARTY-NOTICES` carrying Microsoft's MIT notice (S01 obligation)

### Step 2 · The cancellation shim — the whole of the parser problem

- [ ] Define our own token in `core-types`, with no `vscode` dependency:

  ```
  interface CancellationToken {
    readonly isCancellationRequested: boolean;
    onCancellationRequested(listener: () => void): { dispose(): void };
  }
  ```

  Prefer adapting the standard `AbortSignal` if it fits; a VS Code `CancellationToken` is structurally compatible, so the extension client can pass its own token unchanged.
- [ ] Mechanical replace across the 16 CancellationToken-only files: drop `import * as vscode from 'vscode'`, import our type
- [ ] Delete the stale `vscode` import in `parsers/types.ts`
- [ ] **Delete `ParserPluginLoader.ts`** — VS Code extension discovery has no headless meaning. Note in the fork README that external parser plugins are not supported; contribute a built-in parser instead

### Step 3 · Storage behind an interface

- [ ] Replace `ir/storage/IRStorage.ts`'s `workspace.fs` usage with an `IArtefactStore` interface
- [ ] Provide a Node `fs` implementation; the case store (S28) later provides another
- [ ] `ir/` must end with **zero** `vscode` imports

### Step 4 · Strip telemetry

- [ ] Delete `src/services/TelemetryService.ts` and all call sites
- [ ] Remove `@vscode/extension-telemetry` and `@microsoft/applicationinsights-common` from `package.json`
- [ ] Remove `extensionDependencies: ["ms-azuretools.vscode-azurelogicapps"]` — proprietary, not MIT
- [ ] **CI gate:** grep for `telemetry`, `applicationinsights`, `vscode` across `packages/` and fail on a hit

### Step 5 · Prove it headless

- [ ] `packages/parsers` and `packages/core-ir` build with `@types/vscode` **absent** from the dependency tree — the only honest proof
- [ ] CLI: `ibexcairn parse <path> --out ir.json` produces a schema-valid IR document from a real BizTalk project
- [ ] Round-trip test: parse → validate → serialise → re-validate
- [ ] Transitive dependency licence scan, gated in CI (outstanding S01 item)

### Step 6 · Catalogue what survives

- [ ] Inventory the 13 skill Markdown files per platform in `resources/skills/`; they are prompt assets and should port unchanged (S04)
- [ ] Note `resources/agents/` prompts for the same reason
- [ ] Record for later: upstream models its stage workflow with **`xstate`** (study before S29), and ships **`mermaid`** and **`docx`** as runtime dependencies (relevant to S16/S17)

---

## Definition of done

- [ ] `packages/core-ir` and `packages/parsers` compile and test with no `vscode` in the tree
- [ ] Zero telemetry references; CI enforces it
- [ ] A real `.btproj` yields a schema-valid `ir.json` via the CLI
- [ ] `THIRD-PARTY-NOTICES` present and correct
- [ ] Fork clones cleanly on Windows without special git configuration
- [ ] Base commit recorded

## Out of scope

`stages/`, `services/`, `copilot/`, `views/`, `ui/`, `commands/` — all replaced later by our own orchestrator (S29), case store (S28), `ILlmProvider` (S04) and web UI (S30–S32). Do not port them, and do not port their tests.
