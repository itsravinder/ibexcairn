import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { parsers, ir } from './index';

const FIXTURE = join(__dirname, '..', 'fixtures', 'sample-biztalk', 'X12_00401_850.xsd');

describe('S02 extraction: headless parse to IR', () => {
  it('parses a real BizTalk/EDI schema into a valid IR document, no vscode present', async () => {
    parsers.initializeParsers();
    const parser = parsers.defaultParserRegistry.findForPath(FIXTURE);
    expect(parser, 'a parser should claim the .xsd').toBeTruthy();

    const result = await parser!.parse(FIXTURE);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.ir.schemas.length).toBeGreaterThanOrEqual(1);

    // the produced document is a structurally valid IR document
    expect(ir.isValidIR(result.ir)).toBe(true);
  });

  it('round-trips an IR document through JSON without loss of identity', () => {
    const doc = ir.createEmptyIRDocument('rt-1', 'round-trip', 'biztalk');
    const restored = JSON.parse(JSON.stringify(doc)) as typeof doc;
    expect(ir.isValidIR(restored)).toBe(true);
    expect(restored.metadata.id).toBe(doc.metadata.id);
  });
});
