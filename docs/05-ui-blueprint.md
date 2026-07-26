# 05 · UI blueprint

## Governing principle

**The UI is a pure projection of the artefact store.** No separate UI state — every screen renders artefacts an engine has written.

This is what makes closing the tab mid-run safe, and what keeps the displayed state truthful rather than optimistic. It also means the UI cannot drift from what the engines actually did, which matters when the screen is showing a cost figure someone is about to commit budget against.

## Portfolio dashboard

The only screen an executive sponsor will ever open, so it carries the number they care about.

All applications in the estate, with: source platform · artefact counts · complexity · disposition split · estimated monthly Azure cost · effort · wave · current stage · parity percentage. Plus **aggregate TCO against the current BizTalk baseline**, filters, and a heatmap.

## Per-case screens

### 01 · Load project

Connect GitHub via an app install, upload a zip or MSI, or point an on-premises agent at a folder. Platform auto-detected, user confirms.

Then the optional high-value step: **connect `BizTalkDTADb` for volumetrics**, or Anypoint credentials. Live counters for files discovered, artefacts parsed, parse errors.

### 02 · Analysis

Inventory tree (applications → orchestrations, ports, maps, schemas, pipelines). Interactive dependency graph. Per-flow cards showing archetype, complexity and gaps — each with an **editable disposition dropdown** and a twelve-month traffic sparkline sitting immediately beside it as the evidence for the recommendation. Bulk actions. Severity-ranked gap list.

### 03 · Cost validation

Three panes.

**Volumetrics input** — every figure tagged `measured` or `assumed` so nobody mistakes a guess for a fact, plus a global scenario multiplier (1× / 2× / 10×) and named scenarios ("today", "peak season", "post-acquisition").

**Placement table** — recommendation, alternatives as an override dropdown, monthly cost, a cost-vs-volume sparkline with the crossover marker, live recalculation on override, and blocking constraint chips (*"message >256 KB → Service Bus Standard invalid"*).

**Portfolio panel** — the bin-packing proposal showing which flows share which host, the landing-zone resource list, total monthly cost, and a **savings waterfall** attributing the delta to retire / share-hosts / stateless / connector-swap.

Approval freezes placement into the case.

### 04 · Design document

Section tree with live preview: executive summary, as-is diagram, proposed diagram, landing zone, per-flow design pages, ADRs, cost model, risk register, traceability matrix.

Diagram viewer toggling **as-is ↔ proposed**, with export to Mermaid, draw.io, SVG, PDF and Word. Inline comment threads and per-section regenerate, so a rejected section costs one section rather than the whole document.

### 05 · Development

Per-flow board — queued → generating → building → tests → PR open → merged → failed — with the agent activity stream, generated file tree, sandbox build output and PR links. Retry or refine a single flow with a note, without re-running the estate.

### 06 · Verification

Per-flow parity dashboard plus a **canonicalised message diff viewer**: expected against generated, deltas highlighted. Promotion blocked below the parity threshold, and the block states which flows are holding the wave.

### 07 · Deployment

Environment matrix, drag-to-assign wave planner, IaC diff preview, pipeline run status, shadow-run comparison, cutover checklist, rollback. After go-live, the **actual-against-estimated cost chart** that closes the FinOps loop.

## The stage rail

`Load → Analyse → Cost → Design → Plan → Develop → Verify → Deploy`

The most-looked-at element in the product, so it gets three specific behaviours:

**1 · Every node carries a badge, not just a colour** — gap count, cost, parity, open PRs — so the rail doubles as the case summary and a sponsor can read status without opening anything.

**2 · The active node expands** to show the engine, the current sub-task **in words**, elapsed time and a live-log link. Percentage-only bars misrepresent agent work: *"Placement engine · pricing 34 of 112 flows"* is honest; *"61%"* is not.

**3 · Waiting is not failing.** Six states, distinguished by **form as well as colour**:

| State | Treatment |
|---|---|
| complete | solid filled ring, teal, check glyph |
| running | solid ring with animated dashed arc, teal |
| awaiting your input | **dashed** ring, brass, tinted fill |
| awaiting approval | solid filled ring, brass, gate glyph |
| failed | solid filled ring, **critical red**, cross glyph |
| not started | dotted ring, neutral grey |

The two waiting states are brass, **not red**. They are the most common real states in a human-gated pipeline, and rendering them as errors makes a working product feel broken. Available actions differ per state too — an approval node offers *Approve* and *Request changes*; a failed node offers *Retry* and *View error*.

A working prototype of the rail, including a state selector to inspect all six treatments, is in [dossier.html](dossier.html) §11.

## Visual identity

Established in the dossier and worth carrying into the product:

- **Hue encodes domain** — teal for architecture and platform, brass for money and cost, so a reader can tell a structural claim from an economic one at a glance. Semantic red/green is reserved for status and never used as an accent
- **Three type roles** — monospace for headings, identifiers and section numbers; a humanist serif for prose; system sans with tabular figures for tables, chips and controls
- Neutrals biased green-cyan rather than pure grey
- Both light and dark themes designed, not inverted
