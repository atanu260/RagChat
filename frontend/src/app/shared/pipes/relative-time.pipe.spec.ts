import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();
  const now = new Date('2026-10-11T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats past and future values relative to the current time', () => {
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

    expect(pipe.transform(new Date(now.getTime() - 60_000))).toBe(formatter.format(-1, 'minute'));
    expect(pipe.transform(new Date(now.getTime() + 3_600_000))).toBe(formatter.format(1, 'hour'));
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('not a date')).toBe('');
  });
});
