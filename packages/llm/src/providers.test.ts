import { describe, it, expect } from 'vitest';
import { ClaudeProvider, FakeLlmProvider } from './index';

describe('FakeLlmProvider', () => {
  it('records calls and returns the responder output', async () => {
    const fake = new FakeLlmProvider((req) => `echo:${req.messages[0]?.content ?? ''}`);
    const res = await fake.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.text).toBe('echo:hi');
    expect(fake.calls).toHaveLength(1);
    expect(fake.name).toBe('fake');
  });
});

describe('ClaudeProvider (injected fetch, no network)', () => {
  function cannedFetch(): {
    fetchImpl: typeof fetch;
    seen: { url: string; init?: RequestInit }[];
  } {
    const seen: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = (async (url: RequestInfo | URL, init?: RequestInit) => {
      seen.push({ url: String(url), init });
      return new Response(
        JSON.stringify({
          model: 'claude-sonnet-5',
          stop_reason: 'end_turn',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'thinking', text: '(ignored)' },
            { type: 'text', text: 'world' },
          ],
          usage: { input_tokens: 12, output_tokens: 3 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;
    return { fetchImpl, seen };
  }

  it('sends the right request and parses the response', async () => {
    const { fetchImpl, seen } = cannedFetch();
    const provider = new ClaudeProvider({ apiKey: 'test-key', fetchImpl });

    const res = await provider.complete({
      system: 'you are a migration assistant',
      messages: [{ role: 'user', content: 'map this shape' }],
    });

    // response: only text blocks concatenated
    expect(res.text).toBe('Hello world');
    expect(res.usage).toEqual({ inputTokens: 12, outputTokens: 3 });
    expect(res.stopReason).toBe('end_turn');

    // request: endpoint, auth header, and body shape
    expect(seen).toHaveLength(1);
    expect(seen[0]?.url).toMatch(/\/v1\/messages$/);
    const headers = seen[0]?.init?.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['anthropic-version']).toBeTruthy();
    const body = JSON.parse(String(seen[0]?.init?.body)) as {
      system: string;
      messages: { role: string; content: string }[];
      model: string;
    };
    expect(body.system).toBe('you are a migration assistant');
    expect(body.messages[0]).toEqual({ role: 'user', content: 'map this shape' });
    expect(body.model).toBeTruthy();
  });

  it('throws a clear error without an API key', async () => {
    const { fetchImpl } = cannedFetch();
    const provider = new ClaudeProvider({ apiKey: '', fetchImpl });
    await expect(provider.complete({ messages: [] })).rejects.toThrow(/no API key/i);
  });

  it('surfaces a non-200 as an error', async () => {
    const fetchImpl = (async () =>
      new Response('unauthorized', { status: 401, statusText: 'Unauthorized' })) as typeof fetch;
    const provider = new ClaudeProvider({ apiKey: 'k', fetchImpl });
    await expect(provider.complete({ messages: [] })).rejects.toThrow(/HTTP 401/);
  });
});
