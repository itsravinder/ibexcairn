# 07 · Verification

**Nobody in this market publishes a parity number. That absence is the moat.**

Industry practice on model-driven migration has converged from several directions on the same conclusion: generated code is validated by **replaying real inputs and checking equivalence inside a live environment**, with failures fed back to the agent — not by reading the diff and feeling reassured.

References: [Environment-in-the-Loop](https://arxiv.org/pdf/2602.09944) · [LLM agents for code migration, a case study](https://www.aviator.co/blog/llm-agents-for-code-migration-a-real-world-case-study/)

## The harness

### 1 · Harvest golden pairs

Real input and output message pairs from the source estate — BizTalk tracking history, Mule logs. **These are the specification, and they already exist.** No customer has to write them.

### 2 · Replay locally

Azure Functions Core Tools, Azurite and Docker reproduce the generated flow without touching Azure, so the loop is fast and free. Cost per iteration matters, because there will be many iterations.

### 3 · Canonicalise, then diff

Normalise before comparing: namespace prefixes, attribute order, whitespace, JSON key order, timestamps, generated GUIDs, and any correlation identifier the target assigns.

Skipping this step is how a parity harness gets abandoned — every diff becomes noise, the team stops reading the report, and the gate becomes theatre.

### 4 · Score and gate

Publish parity **per flow**, and block promotion below threshold.

A flow at 100% parity over 300 golden cases is a migration a client can sign off. A flow at 74% is a conversation. The number is the deliverable.

### 5 · Feed failures back

The failing case, expected output and actual output go to the Development engine as the next iteration's input. The environment closes the loop rather than a human transcribing it into a prompt.

## Beyond parity

- **Contract tests** against generated OpenAPI for anything fronted by API Management
- **Schema validation** on every emitted map, both directions
- **Load smoke test** to confirm the placement's throughput assumption actually holds — a Function chosen for volume that cannot sustain the volume is a placement error, not a code error
- **Shadow running** at cutover: BizTalk and Azure processing the same live traffic in parallel, outputs compared continuously, until the parity evidence is boring

## Why this is commercially decisive

Migration projects do not stall on code generation. They stall in the **six months of regression testing afterwards**, where nobody can prove the new system behaves like the old one, and where every unexplained difference triggers another round of investigation.

A tool that arrives with 300 replayed cases per flow and a published parity score is selling *the end of that six months*. That is worth considerably more than the conversion itself, and it is the part of the pitch that survives contact with a sceptical integration architect.

## Relationship to the gates

Verification owns the third approval gate. The Development engine cannot promote its own output; the parity harness decides. This separation is deliberate — **the gate cannot be graded by the same kind of system that wrote the code.**
