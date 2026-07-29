import { describe, it, expect } from 'vitest';
import { cost } from './index';

describe('cost engine (scaffold)', () => {
  it('exposes cost() but defers the implementation to S13', () => {
    expect(() => cost({} as never, {} as never, {} as never)).toThrow(
      /not implemented until S13/,
    );
  });
});
