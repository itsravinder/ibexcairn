/**
 * Provider-agnostic LLM interface.
 *
 * The agentic engines (analysis, planning, conversion) talk to this, never to a
 * concrete SDK. That is what lets the platform run server-side on the Claude API
 * as a SaaS, with the VS Code Language Model API as an optional local provider -
 * rather than being welded to GitHub Copilot the way upstream is. The VS Code LM
 * provider lives in the editor client, NOT in packages/ (the headless guard
 * forbids importing vscode here). See ADR-0001 and docs/02-architecture.md.
 */

export interface LlmMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface LlmRequest {
  /** System prompt - typically a composed skill (see SkillLoader). */
  readonly system?: string;
  readonly messages: readonly LlmMessage[];
  /** Model id. Defaults to the provider's configured model when omitted. */
  readonly model?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface LlmUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface LlmResponse {
  readonly text: string;
  readonly model: string;
  readonly usage: LlmUsage;
  readonly stopReason: string | null;
}

export interface ILlmProvider {
  /** Stable identifier, e.g. 'claude', 'fake', 'vscode-lm'. */
  readonly name: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}
