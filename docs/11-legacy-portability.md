# 11 · Legacy portability

How to handle source artefacts that "cannot migrate" — the question that decides whether a real estate lands or stalls.

## The reframe

*"Cannot migrate"* almost always means *"cannot be modernised"* — and **you do not need to modernise code to move it.** Microsoft built the escape hatch deliberately for BizTalk migration:

- [.NET Framework custom code for Logic Apps Standard is GA](https://techcommunity.microsoft.com/blog/integrationsonazureblog/-net-framework-custom-code-for-azure-logic-apps-standard-reaches-general-availab/3954619) — Standard workflows can call **.NET Framework 4.7.2 assemblies** unchanged ([docs](https://learn.microsoft.com/en-us/azure/logic-apps/create-run-custom-code-functions)). Critically, those assemblies **can be called from inside XSLT maps**, which is exactly the scripting-functoid problem
- [Azure Functions isolated worker supports .NET Framework 4.8](https://learn.microsoft.com/en-us/azure/azure-functions/dotnet-isolated-process-guide), with process isolation so a legacy assembly's dependency versions cannot collide with the host runtime. Microsoft states there is no plan to end that support

**So the framework version is rarely the blocker. Windows-platform coupling is.** Reframed that way, a 2010 helper assembly is often the *easiest* part of an estate to move, because it moves untouched.

## The portability ladder

Every component gets a tier. Most 2010-vintage code lands in tier 2 or 3.

| Tier | Strategy | Solves | Cost signal |
|---|---|---|---|
| **0 · Retire** | Don't move it | Code serving a business process that no longer exists — common at this vintage | Saves everything |
| **1 · Reuse verbatim** | Lift XSLT and schemas as-is | Plain maps, XSDs | Near zero. The cheapest win available |
| **2 · Lift the binary** | Logic Apps Standard local function (.NET FW **4.7.2**) or Functions isolated worker (**4.8**), assembly unchanged | Helper libraries, custom functoids, enrichment routines, formatters | Low — a wrapper, no recompile of business logic |
| **3 · Encapsulate** | Windows container on Container Apps or an AKS Windows node pool | 32-bit, COM/COM+ registration, GAC dependencies, P/Invoke, Windows-only APIs | Higher run cost, but it *moves* |
| **4 · Remain, expose** | Component stays on-premises; Azure calls it via Logic Apps **Hybrid**, the on-premises data gateway, or a self-hosted API | Licensed third-party libraries with no cloud entitlement, HSM-bound certificates, mainframe protocols, network-locked vendor systems | Gateway plus retained infrastructure |
| **5 · Leave the flow** | Whole flow stays on BizTalk indefinitely | Nothing above works and the logic is still needed | **Retained BizTalk licence, VMs and support — must appear in the TCO** |
| **6 · Rewrite** | Reimplement from characterised behaviour | Logic is understood, valuable, and genuinely blocked | Most expensive, highest risk. Last resort |

## What genuinely cannot move

Not the .NET version — these:

- **MSDTC / distributed transactions.** 2010-era BizTalk leans on them; Azure has no equivalent. Forces a saga and compensation redesign — see [06 · Hard problems](06-hard-problems.md)
- **MSMQ**, NTFS-ACL-dependent file shares, Enterprise SSO
- **COM / COM+ and 32-bit native DLLs** — tier 3, not tier 2
- **Custom adapters** for proprietary TCP, LU6.2, or obsolete MQ versions
- **Code referencing BizTalk runtime APIs** — `IBaseMessage`, context property bags, ExplorerOM. There is no MessageBox, so there is nothing to port to
- **Licensed third-party components** without a cloud entitlement. A commercial blocker rather than a technical one, and frequently the hardest to resolve
- **HSM- or machine-bound certificates**

## Characterise before you tier

A black box cannot be tiered. The machinery already exists in the plan: **point the golden-pair harness at the component, not just the flow.**

1. Extract real input/output pairs for that component from tracking history — this is the behavioural specification, and it already exists
2. Decompile (ILSpy) to confirm the observed behaviour and detect platform coupling
3. Assign the tier from the evidence
4. A lifted binary then arrives with parity tests already written

This turns *"we lost the source in 2014"* from a blocker into a survivable condition.

## Product consequences

### The disposition vocabulary was too small

`retire / consolidate / migrate / rewrite` cannot express the ladder. Extended to:

`retire` · `reuse` · `lift` · `encapsulate` · `remain` · `stay` · `migrate` · `rewrite` · **`blocked`** (nothing works — escalate to a human decision)

**"Cannot migrate" must be a named strategy carrying a cost, never a gap-list footnote.**

### The portability scanner is deterministic analysis, not judgement

Scan every assembly for: target framework version · 32/64-bit · COM references · P/Invoke declarations · references to BizTalk runtime assemblies · MSMQ and MSDTC usage · GAC and strong-name dependencies · third-party licensed libraries.

That output **assigns the tier automatically**. It belongs in the Analysis engine, not in an architect's spreadsheet. Tracked as stage **S38**.

### Hybrid-estate TCO is a differentiator, not a caveat

Tiers 4 and 5 mean the honest answer for some estates is *"nine flows cannot move, so you will still be paying for BizTalk."* Putting a number on that — retained licence, VMs, support, and the clock running against BizTalk's support lifecycle — is what nobody tells the CIO, and it is the number that decides whether to fund the tier-6 rewrites.

Microsoft's free tool will never produce it. Ours should, as a named output of the Placement & Cost engine.

## Two constraints on our own build

Both discovered while verifying the above, and both are infrastructure decisions rather than details:

1. **Logic Apps Standard custom-functions tooling is Windows-only** (VS Code on Windows). Our generation and build agents therefore cannot be Linux-only. Affects **S03** and **S25**
2. **The framework targets differ** — Logic Apps local functions are 4.7.2, Functions isolated worker is 4.8. A 2010 assembly targeting 3.5 or 4.0 needs a retarget decision, and **the chosen Azure target constrains it**. Belongs in the constraint filter, **S14**

## Reusable upstream asset

The fork target already ships a skill for exactly this path: [`resources/skills/dotnet-local-functions-logic-apps/biztalk/SKILL.md`](https://github.com/Azure/logicapps-migration-agent/blob/main/resources/skills/dotnet-local-functions-logic-apps/biztalk/SKILL.md). Further evidence for the fork strategy in [ADR-0001](adr/0001-fork-logicapps-migration-agent.md).

## Open item

**BizTalk Server support lifecycle end dates are not yet confirmed.** Tier 5 is only defensible until then, and the deadline is the strongest argument in the sales conversation. Confirm from Microsoft's official lifecycle page before this appears in any customer-facing material — do not quote a date from memory.
