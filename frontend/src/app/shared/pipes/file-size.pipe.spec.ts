import { describe, expect, it } from 'vitest';
import { FileSizePipe } from './file-size.pipe';

describe('FileSizePipe', () => {
  const pipe = new FileSizePipe();

  it('formats bytes and larger binary units', () => {
    expect(pipe.transform(512)).toBe('512 B');
    expect(pipe.transform(1024)).toBe('1 KB');
    expect(pipe.transform(1_572_864)).toBe('1.5 MB');
  });

  it('caps very large values at gigabytes', () => {
    const formattedValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
      .format(1024 ** 2);
    expect(pipe.transform(1024 ** 5)).toBe(`${formattedValue} GB`);
  });

  it('returns an em dash for invalid or negative sizes', () => {
    expect(pipe.transform(-1)).toBe('—');
    expect(pipe.transform(Number.NaN)).toBe('—');
    expect(pipe.transform(Number.POSITIVE_INFINITY)).toBe('—');
  });
});
