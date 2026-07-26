# 01 · Landscape

Research current as of **26 July 2026**. Two absences run through every row of this table: **nobody verifies behavioural equivalence, and nobody prices the target.**

## Prior art

### Azure Logic Apps Migration Agent — the fork target

[github.com/Azure/logicapps-migration-agent](https://github.com/Azure/logicapps-migration-agent) · [overview](https://learn.microsoft.com/en-us/azure/logic-apps/migration/migration-agent-overview) · [extension guide](https://learn.microsoft.com/en-us/azure/logic-apps/migration/migration-agent-extend) · preview

A VS Code extension, open source, released by Microsoft in 2026. It contains most of the front half of what we need.

**What it has**

- A **registry-based parser architecture** in `src/parsers/` — each parser implements an `IParser` interface with `capabilities`, `canParse(filePath)` and `parse(filePath, options)`, registered through `defaultParserRegistry.register(...)`
- A **platform-neutral intermediate representation** (`docs/IRSchema.md`) with eight primary sections — `metadata`, `workflow`, `triggers`, `actions`, `variables`, `connections`, `schemas`, `maps` — plus `messageProcessing`, `endpoints`, `correlation`, `errorHandling`, `rules`, `B2B`, `observability`, `dependencies`, `gaps`, `extensions`. Actions form a DAG via `runAfter`
- **Layered isolation** — platform specifics live in `sourceMapping`, destination specifics in `targetMapping`, keeping the core model clean
- A **normalised vocabulary** already reconciled across BizTalk, MuleSoft, Boomi, IBM IIB, TIBCO, Workato, Informatica and Apache Camel
- A **five-stage workflow** — Discovery → Planning → Conversion → Validation → Deployment
- Three Copilot agents (`@migration-analyser`, `@migration-planner`, `@migration-converter`), **25 registered language-model tools**, and **13 Markdown skill files per platform** (`detect-logical-groups`, `source-to-logic-apps-mapping`, `logic-apps-planning-rules`, `workflow-json-generation-rules`, `connections-json-generation-rules`, `no-stubs-code-generation`, `runtime-validation-and-testing`, and others)

**Supported source artefacts**

| Platform | Artefacts | Status |
|---|---|---|
| BizTalk Server 2016, 2020 | `.btproj`, `.odx`, `.xsd`, `.btm`, `.btp`, bindings XML | Complete, built-in |
| MuleSoft Anypoint (Mule 3, 4) | `mule-*.xml`, `pom.xml` | **Stub — "in progress, not yet available"** |

**What it does not do**

- **Logic Apps Standard is the only target.** It emits `workflow.json`, `connections.json` and .NET local functions. There is no representation of the question "should this be a workflow at all?"
- **Bound to VS Code plus a GitHub Copilot subscription.** The intelligence lives in Copilot agents driven through the VS Code Language Model API — unsellable as SaaS, and a blocker in regulated environments
- **External parser plugins cover only the Discovery stage.** Planning and conversion require contributing a built-in parser upstream, which means depending on someone else's merge cycle
- No portfolio assessment, no equivalence testing, no traceability artefacts, no multi-tenant run history

### BizTalk Migration Starter — the honest limitations list

[github.com/haroldcampos/BizTalkMigrationStarter](https://github.com/haroldcampos/BizTalkMigrationStarter) · [announcement](https://techcommunity.microsoft.com/blog/integrationsonazureblog/a-biztalk-migration-tool-from-orchestrations-to-logic-apps-workflows/4494876)

By the same author as the Microsoft documentation. Three deterministic CLIs plus an MCP server exposing 25 AI tools:

- `ODXtoWFMigrator` — `.odx` → `workflow.json`, with shape mapping, binding analysis and expression translation. Detects self-recursive calls and converts them to loops; callable orchestrations become Request-triggered workflows
- `BTMtoLMLMigrator` — `.btm` → Logic Apps Data Mapper `.lml`
- `BTPtoLA` — `.btp` → workflows, detecting standard pipeline patterns

Its stated limitations are the most useful document in the landscape, because they are the real map of the hard parts: *XSLT content extraction not automated, correlation sets require manual translation, scripting functoids need conversion, custom pipeline components lack Logic Apps equivalents, compensation logic requires manual testing.*

### Azure Integration Migrator (AIM) — the cautionary tale

[Azure/aimbiztalk](https://github.com/Azure/aimbiztalk) · [Azure/aimazure](https://github.com/Azure/aimazure) · plus `aimtool`, `aimcore`, `aimmodel` · [deep dive](https://www.slideshare.net/slideshow/integration-monday-biztalk-migrator-deep-dive/239652462)

The previous generation, marketed as "BizTalk Migrator". A CLI that decomposed MSI files into a source model, mapped that to a target model, and emitted Azure Integration Services assets through template configuration. **Entirely deterministic — and it stalled**, because rule-based conversion cannot cover the long tail of a twenty-year-old estate.

This is the historical argument for our deterministic-core-plus-LLM-at-the-edges split. It is equally an argument against the opposite overcorrection.

### Mule Migration Assistant — the engineering pattern worth copying

[github.com/mulesoft/mule-migration-assistant](https://github.com/mulesoft/mule-migration-assistant) · Apache 2.0 · [docs](https://github.com/mulesoft/mule-migration-assistant/blob/master/docs/user-docs/migration-tool.adoc)

Mule 3 → Mule 4, so the wrong direction for us, but the best available architecture for a conversion engine:

- **Tasks composed of Steps** as the unit of migration
- **SPI-based discovery** so community contributions never touch core
- A dedicated **Expression Migrator** module for MEL → DataWeave translation
- An **Engine** that identifies project type, discovers tasks and executes them
- A **migration report**, including an experimental JSON format, that flags anything it cannot convert with a pointer to documentation

Copy this shape: pluggable rules plus a machine-readable gap report.

## Concept mapping already published

Microsoft's own [feature matchup](https://learn.microsoft.com/en-us/azure/logic-apps/biztalk-server-migration-overview) removes most of the research risk from a multi-target design. Notable entries:

- Orchestrations → workflows, workflow templates, local functions
- Pipelines and pipeline components → workflows-as-pipelines plus local functions
- MessageBox, property promotions, filters → **Service Bus queues and topics** with message properties and subscriptions (RabbitMQ exchanges in the Hybrid hosting model)
- Adapters → Logic Apps connectors
- `xref_*` cross-reference tables → local functions
- Maps → XSLT, Liquid templates, Data Mapper
- **Business Rules Engine → Logic Apps Rules Engine, which uses the same runtime** — the cheapest win available
- BAM → Azure Business Process Tracking
- EDI, AS2, X12, EDIFACT and the HL7/SWIFT/RosettaNet accelerators → Integration Account plus protocol connectors
- Tracking → run history, tracked properties, Application Insights, Azure Monitor; OpenTelemetry for Hybrid
- Binding-file deployment → Bicep, Terraform, Azure Pipelines

Microsoft also states plainly that **correlation sets, parallel convoys, dehydration/rehydration and complex exception handling have no one-to-one Logic Apps equivalent**, recommending decomposition into smaller independently testable units with Service Bus `CorrelationId` replacing MessageBox correlation. See the [aggregator pattern walkthrough](https://techcommunity.microsoft.com/blog/integrationsonazureblog/implementing--migrating-the-biztalk-server-aggregator-pattern-to-azure-logic-app/4495107).

For MuleSoft, the API-led layers map cleanly: **Experience → API Management, Process → Logic Apps, System → Functions / Service Bus** ([reference](https://www.hortoncloud.com/post/migrating-from-mulesoft-to-azure-without-compromising-your-3-layered-connectivity-architecture)).

## Confirmed gaps in the market

**No DataWeave converter exists.** Searching for DataWeave → XSLT or DataWeave → Liquid translation returns nothing but documentation of the three languages separately. DataWeave is a full functional language, so this is a language-translation problem, not a mapping table. Budget it as research.

**No equivalence testing.** Industry practice on model-driven migration has converged on input replay plus equivalence checking inside a live environment, with failures fed back to the agent — see [Environment-in-the-Loop](https://arxiv.org/pdf/2602.09944) and [this case study](https://www.aviator.co/blog/llm-agents-for-code-migration-a-real-world-case-study/). No integration-migration product implements it.

**No cost modelling.** Not one tool in this space prices the target it recommends.

## Services competitors

Neudesic, Valorem, Tellestia, [BeyondBizTalk](https://www.beyondbiztalk.com/) and others sell assessment-and-roadmap engagements and hand-executed migrations — occasionally to MuleSoft or custom .NET rather than Azure. People, not product: no repeatable artefact, no parity evidence, no portfolio economics. They are also the most likely channel partners.

## Adjacent standards considered and set aside

[Serverless Workflow](https://serverlessworkflow.io/) and [Apache Camel's DSLs](https://developers.redhat.com/articles/2023/09/20/which-camel-dsl-should-you-use) were both evaluated as an off-the-shelf neutral IR. Both are runtime specifications rather than migration representations — they model what should execute, not the source lineage, gap list and confidence scoring a migration needs. The academic framing of this trade-off is in [Towards the interoperability of low-code platforms](https://arxiv.org/pdf/2412.05075). Decision: extend the upstream IR instead.
