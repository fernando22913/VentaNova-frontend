import { describe, expect, it } from 'vitest';

import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('formats integer cents as USD', () => {
    expect(pipe.transform(3999)).toBe('$39.99');
    expect(pipe.transform(0)).toBe('$0.00');
    expect(pipe.transform(499)).toBe('$4.99');
    expect(pipe.transform(199999)).toBe('$1,999.99');
  });

  it('returns empty for null, undefined or NaN', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(Number.NaN)).toBe('');
  });
});
