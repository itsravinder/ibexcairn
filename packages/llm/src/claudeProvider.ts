import type { ILlmProvider, LlmRequest, LlmResponse } from './provider';

/** Default model for agentic work. The build itself may run on a different
 * Claude model; this is the runtime default the product ships with. */
export const DEFAULT_MODEL = 'claude-sonnet-5';
const DEFAULT_BASE_URL = 'https://api.anthropic.com';
const DEFAULT_API_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 4096;

export interface ClaudeProviderOptions {
  /** Defaults to process.env.ANTHROPIC_API_KEY, read when complete() is called. */
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  apiVersion?: string;
  /** Injectable fetch for tests. Defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

interface AnthropicContentBlock {
  readonly type: string;
  readonly text?: string;
}
interface AnthropicResponse {
  readonly model: string;
  readonly stop_reason: string | null;
  readonly content: readonly AnthropicContentBlock[];
  readonly usage: { readonly input_tokens: number; readonly output_tokens: number };
}

/** Claude implementation of ILlmProvider over the Anthropic Messages API. */
export class ClaudeProvider implements ILlmProvider {
  readonly name = 'claude';
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly maxTokens: number;
  private readonly apiVersion: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClaudeProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env['ANTHROPIC_API_KEY'];
    this.model = options.model ?? DEFAULT_MODEL;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new Error(
        'ClaudeProvider: no API key. Set ANTHROPIC_API_KEY or pass apiKey to the constructor.',
      );
    }

    const body: Record<string, unknown> = {
      model: request.model ?? this.model,
      max_tokens: request.maxTokens ?? this.maxTokens,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (request.system !== undefined) body['system'] = request.system;
    if (request.temperature !== undefined) body['temperature'] = request.temperature;

    const res = await this.fetchImpl(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Claude API returned HTTP ${res.status} ${res.statusText}: ${detail}`);
    }

    const json = (await res.json()) as AnthropicResponse;
    const text = json.content
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text ?? '')
      .join('');

    return {
      text,
      model: json.model,
      usage: {
        inputTokens: json.usage.input_tokens,
        outputTokens: json.usage.output_tokens,
      },
      stopReason: json.stop_reason,
    };
  }
}
