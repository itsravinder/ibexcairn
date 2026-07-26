# 09 · Naming

**Decision: Ibex Cairn.** Repository `itsravinder/ibexcairn`, created 26 July 2026.

## Why

An **ibex** stands and moves confidently on terrain that looks impossible — which is what a twenty-year-old BizTalk estate is.

A **cairn** marks a proven route so everyone who follows crosses safely. That is precisely what a repeatable migration platform is: the first traverse is expensive, and every subsequent one follows the markers.

Both words pull in the same direction, which is rare in a compound name.

## Why a compound was necessary, not decorative

The root "Ibex" is crowded, and one of the incumbents is in enterprise software using the same compound pattern.

| Existing holder | What they are | Relevance |
|---|---|---|
| [**IBEX Limited** (NASDAQ: IBEX)](https://stockanalysis.com/stocks/ibex/) | Publicly traded customer-experience / BPO company, ~$164M revenue per quarter, founded 1984. Owns **ibex.co**, brands lowercase "ibex" | Uses **ibex Connect / ibex Digital / ibex CX** — exactly the "ibex + word" pattern. Dominates search results for "ibex" plus any business term |
| [**Ibexa**](https://www.ibexa.co/about-ibexa) | Enterprise B2B software — Digital Experience Platform. Oslo, formerly eZ Systems, part of QNTM Group. Owns **ibexa.co** | Product family **Ibexa Content / Ibexa Experience / Ibexa Commerce**. Closest collision: enterprise software, same naming pattern |
| IBEX 35 | Spanish stock market index | Minor SEO noise |

This **inverts the usual assumption**: a generic second word is the risky choice. "Ibex Platform", "Ibex Cloud", "Ibex Systems" would give almost no distinctiveness and sit closest to two incumbents who own the obvious domains. A vivid, concrete second word buys a cleaner trademark position, a clean exact-match domain, and search results not dominated by a NASDAQ listing.

**Words burned by the incumbents** — do not use as a product, module or suite name: `Connect`, `Digital`, `CX`, `Content`, `Experience`, `Commerce`.

Neither incumbent operates in integration middleware, so this is not fatal — trademark protection is class- and market-specific. But it does mean the clearance work below is not optional.

## Alternatives considered

| Considered | Outcome |
|---|---|
| **Assay** | Strong — determining true composition and value before committing capital. Rejected only because "Ibex" was preferred; would still work as a sub-product name for the assessment engine |
| **Ibex Traverse** | Runner-up. A traverse is a controlled crossing of terrain you cannot go straight up |
| **Ibex Ledger** | Strongest if leading with economics rather than terrain |
| **Ibex Datum**, **Ibex Col**, **Ibex Bearing**, **Ibex Ridge** | Viable; less narrative pull |
| **Manifold** | Described the hub-and-spoke IR exactly, but collides with Manifold Markets / Manifold Finance |
| **Parity** | Semantically perfect for the verification moat; **rejected** — Parity Technologies is established in software |
| **Godwit**, **Tern**, **Monarch**, **Caribou** | Animal-migration names, good stories; Ibex won on brevity and the terrain metaphor |
| **Ibexa-anything** | Taken, in our sector |
| **Ibex Ledge** / **Ibex Summit** / **Ibex Labs** | Precarious idiom / conference-brand fatigue / undercuts enterprise-readiness |

## Names that must never be used

**Never put `BizTalk`, `MuleSoft`, `Mule`, or `Azure` in a product, package, module or repository name.** Those are Microsoft and Salesforce marks. Descriptive use in prose — "migrates BizTalk orchestrations to Azure" — is legitimate nominative use; naming is not. This also protects the Azure Marketplace listing and co-sell path, which we specifically want since Microsoft owns the destination platform.

Animal names to avoid, four of which sit inside our own stack:

| Avoid | Reason |
|---|---|
| **Camel** | Apache Camel is an *integration framework*. Worst possible collision in our category |
| **Mule** | MuleSoft — the competitor we migrate people off |
| **Kudu** | The deployment engine behind Azure App Service, which our generated Logic Apps Standard projects run on |
| **Oryx** | The Azure build system. Same problem |
| **Kestrel** | The ASP.NET Core web server. Our Functions output runs on it |
| **Swift** | Apple |
| **Albatross** | The idiom means *a burden you cannot shake off*. Catastrophic for a migration product |
| **Locust**, **Termite**, **Remora** | Load-testing tool / destruction / parasitism |

Also avoid `-ify`, `-ly`, `-r` suffixes and any `…AI` suffix — the latter dates a product to 2023–2026 the way `…Cloud` dates one to 2012.

## Naming architecture

Borrowed from Ubuntu, which is **not** an animal name — it is a Nguni Bantu word for shared humanity, with animals used only for release codenames in an alliterating adjective + animal pattern.

Applied here:

- **Product**: `Ibex Cairn`. People will shorten it to "Ibex" in speech, which is fine and even desirable — the compound exists to own the mark, the domain and the search results, not to be said aloud every time
- **Releases / migration waves**: alliterating adjective + alpine animal — *Frugal Fossa*, *Patient Pangolin*, *Diligent Dunlin*. Gives customers something human to say in standups without making the product itself sound whimsical
- **Engines stay literal**: `Placement & Cost Engine`, never a codename. An architecture document where every box has an animal name is unreadable, and that document is a sales asset

## Outstanding legal work

Collisions above were identified by web search on 26 July 2026, **not by legal clearance**. Before spending money on the brand:

- [ ] USPTO search, classes **9** (software) and **42** (SaaS)
- [ ] EUIPO search, same classes
- [ ] Azure Marketplace name-collision check
- [ ] Domain acquisition — target the exact-match compound (`ibexcairn.com`); do not fight for any `ibex`-only variant, all of which are taken or expensive
- [ ] GitHub organisation and npm scope
- [ ] Formal opinion on coexistence with IBEX Limited and Ibexa given differing classes and markets
