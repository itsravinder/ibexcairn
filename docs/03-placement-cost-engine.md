# 03 · Placement & Cost engine

The engine that makes the product defensible. Six steps, in this order — getting the order wrong produces confident nonsense.

```
0 Disposition → 1 Volumetrics → 2 Archetype → 3 Constraints → 4 Price → 5 Pack → (6 Recalibrate)
```

## Step 0 · Disposition, before placement

BizTalk hands you the evidence for free. `BizTalkDTADb` holds tracking history per receive port, send port and orchestration; `BizTalkMsgBoxDb` holds the subscription topology. Together they answer the question no stakeholder interview answers honestly: **which of these artefacts actually carries traffic?**

Label every artefact with a disposition and attach the traffic evidence to it. The vocabulary spans the [portability ladder](11-legacy-portability.md), because "cannot migrate" must be a named strategy carrying a cost rather than a gap-list footnote:

`retire` · `reuse` · `lift` · `encapsulate` · `remain` · `stay` · `migrate` · `rewrite` · `blocked`

On a fifty-application estate a meaningful slice has had no traffic for a year. Retiring 20% of the estate is a 20% saving that no conversion improvement can match, and it is the one recommendation a client can act on the same afternoon.

## Step 1 · Volumetrics — the input nobody collects

**Code cannot reveal traffic.** A repository tells you what a flow does, never how often. Volumetrics must therefore come from one of three sources, in strict priority:

1. **Harvested** from `BizTalkDTADb` / `BizTalkMsgBoxDb` (plus BAM/HAT where enabled). MuleSoft equivalent: Anypoint Monitoring and runtime logs
2. **Entered** per flow in the UI
3. **Defaulted**, with the assumed range stated explicitly

Every downstream figure is tagged with which of the three it came from, and the UI surfaces that tag as `measured` or `assumed`. A cost model built on silent assumptions is worse than no cost model, because it will be quoted in a board paper.

Collect: messages/month per flow · average and p95 message size · hourly distribution and peakiness · average orchestration duration · retry and suspend rates.

## Step 2 · Archetype classification

Classify the flow from the IR, then emit candidate **compositions** — trigger + compute + state + exposure — not a single service. A flow rarely maps to one thing.

| Archetype | Azure composition | Why it is cheaper |
|---|---|---|
| Stateless transform & forward, high volume | Function (Flex Consumption) + Service Bus | No per-action meter, no storage writes |
| Content-based routing / pub-sub fan-out | Service Bus topics + subscription rules | Routing becomes configuration — **no compute at all** |
| Event notification, high fan-out, small payload | Event Grid | Per-million-operation pricing is the cheapest tier available |
| Synchronous request/response façade | APIM + Function backend | One shared APIM amortised across the estate |
| Long-running with human steps or day-scale waits | Logic Apps Standard, stateful | Durability is the requirement; volume is low so plan cost is irrelevant |
| Code-heavy long-running, high volume | Durable Functions | Orchestration without per-action or connector billing |
| Convoy / aggregator / correlation | Service Bus sessions + Durable entity, or stateful Logic App keyed on `CorrelationId` | Only viable semantics; sessions are effectively free |
| Scheduled batch / bulk file movement | Function timer + Blob | ADF per-activity-run and DIU charges dwarf a timer function |
| Reference-data lookup (`xref_*`) | Table Storage + cache | Orders of magnitude below Cosmos DB for key lookups |
| Business rules (BRE) | Logic Apps Rules Engine | Same runtime as BizTalk BRE — near-zero refactor |
| EDI / B2B | Logic Apps Standard + shared Integration Account | Fixed cost, so consolidate every trading partner into one |

## Step 3 · Hard-constraint filter — overrides price

Applied *after* classification. A constraint can eliminate the cheapest candidate outright:

- Message size above 256 KB — Service Bus Standard is out; claim-check to Blob or move to Premium
- Strict ordering — sessions required
- VNet or private endpoint requirement
- Latency SLO
- Transactionality and idempotency guarantees
- X12 / EDIFACT / AS2 — forces Logic Apps Standard plus Integration Account
- Adapter availability for SAP, MQ, HL7
- Custom .NET assemblies — forces Functions or Container Apps
- Data residency and compliance

## Step 4 · Price every surviving candidate

Rates come from the [Azure Retail Prices API](https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices) — unauthenticated, per-region, per-SKU — multiplied by the harvested volumetrics. The model accounts for executions, actions per execution, **connector-call class**, storage transactions, duration and vCPU, egress and retention.

Output is a **curve, not a number**. `cost(placement, volume, rate_card)` is a pure function, so render cost across volume decades with markers at the points where the recommended candidate changes.

> **Non-negotiable: the language model never produces a cost figure.** It classifies ambiguous flows and writes the rationale; the priced model produces every number. See [ADR-0004](adr/0004-llm-never-produces-cost-figures.md).

### Billing detail that materially changes answers

Logic Apps **Consumption** meters every action. Logic Apps **Standard** includes built-in service-provider connectors (Service Bus, SQL, SFTP, Blob) in the plan and meters only enterprise/managed connectors. Getting this wrong overstates Standard and produces the wrong recommendation — it was an error in the first draft of our own model, caught during verification.

Stateful workflows write to Storage queues, tables and blobs on every action; stateless keeps state in memory.

## Step 5 · The four levers worth encoding

1. **Enterprise connector meters are the silent budget killer.** At roughly $0.001 per enterprise connector action, a SAP flow at one million messages a month costs about **$1,000/month in connector charges alone**, before any compute. Replacing it with a Function using a native client removes the meter entirely. Flag every enterprise-connector flow above a volume threshold as a rewrite candidate.

2. **Stateful → stateless wherever the IR proves it safe.** Where there are no waits, no long-running behaviour and no need for run history, default to stateless — and flag the trade-off honestly: roughly a five-minute ceiling and no run history to debug with.

3. **The Consumption ↔ Workflow Service Plan crossover** sits near seven million built-in actions a month against a WS1 plan at roughly $180/month. Compute it per candidate; never apply it as a blanket policy.

4. **Bin-pack the hosts.** Fifty applications do not need fifty Workflow Service Plans. Packing workflows onto shared plans — subject to blast radius, deploy cadence, scaling profile, security boundary and SLA tier — typically saves more than every per-flow service decision combined.

### Portfolio optimisation

Emit the shared landing zone **once** and reference it from all fifty applications: shared Workflow Service Plans, shared Function Apps, one APIM instance, one Service Bus namespace, one Key Vault, one Log Analytics workspace, one Integration Account for all trading partners, one schema and map registry, one common error-handling / dead-letter / resubmit workflow.

### Hybrid-estate TCO — a named output, not a caveat

Some flows will not move. Tiers 4 and 5 of the [portability ladder](11-legacy-portability.md) retain on-premises cost: BizTalk licences, VMs, support contracts, and the gateway infrastructure to reach them.

The honest total — *"nine flows cannot move, so you will still be paying £X a year for BizTalk"* — is the figure nobody tells the CIO, and it is what decides whether to fund the tier-6 rewrites. It must appear in the portfolio TCO alongside the Azure run cost rather than being omitted because it is inconvenient. Microsoft's free tool has no incentive to produce it.

Pair it with the BizTalk support lifecycle deadline, which puts a clock on tier 5. **Confirm those dates from Microsoft's lifecycle page — never quote them from memory.**

## Step 6 · Close the loop

After each wave deploys, ingest Azure Cost Management actuals and Application Insights telemetry, diff against the estimate, and recalibrate the model's coefficients.

This converts a one-shot migration tool into a recurring-revenue product: the estimator measurably improves with every customer, and no competitor starting later has the calibration data.

## Policy, not hardcoded logic

Express the rules as **declarative, versioned YAML** so each customer can tune thresholds and every recommendation is auditable after the fact. When an architect overrides a placement, capture the reason — those overrides are both the training signal for the policy and the audit trail.

## Worked example — illustrative, from our own model

Single flow, twelve built-in and two connector actions per message, twenty workflows sharing a plan, stateful. Costs are illustrative model output, not quotations.

| Volume/month | Consumption | Standard dedicated | Standard shared | Function + SB | Cheapest |
|---|---|---|---|---|---|
| 1,000 | $0.55 | $180 | $9.00 | $10.00 | Consumption |
| 10,000 | $5.50 | $180 | $9.01 | $10.01 | Consumption |
| 100,000 | $55.00 | $180 | $9.05 | $10.05 | **Standard shared** |
| 1,000,000 | $550 | $181 | $9.50 | $10.50 | **Standard shared** |
| 3,000,000 | $1,650 | $182 | $181.50 | $11.50 | **Function + SB** |
| 10,000,000 | $5,500 | $185 | $185 | $15.00 | **Function + SB** |

Two crossovers, both easy to miss in a spreadsheet:

- **≈17,000 msgs/month** — the per-action Consumption meter overtakes a shared plan. The answer stops being "pay per use" and becomes *share a host you already own*
- **≈2,100,000 msgs/month** — the shared plan exhausts capacity, steps up to dedicated, and a Function with Service Bus wins instead

Enable the enterprise connector and both collapse into a single flip at **≈7,000 msgs/month**, straight to the Function, because that meter applies to both Logic Apps options and to neither Function option.

Below the first crossover, cost is almost entirely **fixed** — a WS1 plan, an APIM tier, an Integration Account — and per-message meters are pennies. A tool that answers *"use Logic Apps, $180/month"* for a ten-thousand-message flow is giving actively harmful advice, and across fifty applications it gives it fifty times.

An interactive version of this model is in [dossier.html](dossier.html) §09.
