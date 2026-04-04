import { describe, expect, it } from 'vitest';
import { parseLampState } from './lampUtils';

describe('lampUtils', () => {
  it('accepts the success lamp state', () => {
    expect(parseLampState('success')).toBe('success');
  });

  it('falls back for unknown lamp states', () => {
    expect(parseLampState('mystery-state')).toBe('idle');
  });
});
