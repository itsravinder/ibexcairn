import { describe, it, expect } from 'vitest';
import { PROVENANCE_VALUES } from './index';

describe('core-types', () => {
  it('exposes exactly the two provenance values', () => {
    expect(PROVENANCE_VALUES).toEqual(['measured', 'assumed']);
  });
});
