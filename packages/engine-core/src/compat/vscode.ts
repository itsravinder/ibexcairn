/**
 * Minimal, dependency-free stand-ins for the few VS Code types the lifted
 * parsers reference. After ParserPluginLoader was removed, only
 * CancellationToken survives.
 *
 * The engine is headless: it must build and run with no `vscode` module present
 * (enforced by scripts/check-no-vscode.mjs). The real editor types live in the
 * VS Code client, which can still pass its own CancellationToken here because
 * the shape matches. Imports of `vscode` in the lifted files were rewritten to
 * point at this module. See docs/specs/002-headless-extraction.md and ADR-0001.
 */

/** Structurally compatible with vscode.CancellationToken. */
export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  onCancellationRequested(listener: (e: unknown) => unknown): { dispose(): void };
}
