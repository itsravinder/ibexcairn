import type { ILlmProvider, LlmRequest, LlmResponse } from './provider';

/**
 * Deterministic in-memory provider for tests and offline runs. Records every
 * request and returns whatever the responder produces, so engine logic can be
 * exercised without a network call or an API key.
 */
export class FakeLlmProvider implements ILlmProvider {
  readonly name = 'fake';
  readonly calls: LlmRequest[] = [];

  constructor(private readonly responder: (request: LlmRequest) => string = () => '') {}

  complete(request: LlmRequest): Promise<LlmResponse> {
    this.calls.push(request);
    return Promise.resolve({
      text: this.responder(request),
      model: 'fake',
      usage: { inputTokens: 0, outputTokens: 0 },
      stopReason: 'end_turn',
    });
  }
}
