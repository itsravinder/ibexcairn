# Third-party notices

Ibex Cairn includes and builds upon third-party open-source software. Their
licences and copyright notices are reproduced below.

---

## Azure/logicapps-migration-agent

`packages/engine-core` (the source parsers and intermediate representation) and
the skill files under `packages/llm/skills` are derived from
[Azure/logicapps-migration-agent](https://github.com/Azure/logicapps-migration-agent),
used and modified under the MIT License.

Base commit: `4b08eb8ceff95aeef48def73205e04586afdb4e5`.
Modifications: removed the VS Code extension host, telemetry, and the proprietary
extension dependency; lifted the parsers and IR into a headless library (see
[docs/specs/002-headless-extraction.md](docs/specs/002-headless-extraction.md)).

```
MIT License

Copyright (c) 2026 Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Runtime dependencies

Bundled/at-runtime dependencies retain their own licences; see each package's
entry under `node_modules`. Notably `@xmldom/xmldom` (MIT). A full transitive
licence scan is gated in CI as an outstanding S01 follow-up.
