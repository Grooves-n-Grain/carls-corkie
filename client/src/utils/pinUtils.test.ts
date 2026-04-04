import { describe, it, expect } from 'vitest';
import { getRotation } from './pinUtils';

describe('getRotation', () => {
  it('returns consistent rotation for the same id', () => {
    const rotation1 = getRotation('test-pin-123');
    const rotation2 = getRotation('test-pin-123');
    expect(rotation1).toBe(rotation2);
  });

  it('returns different rotations for different ids', () => {
    const rotation1 = getRotation('pin-a');
    const rotation2 = getRotation('pin-b');
    expect(rotation1).not.toBe(rotation2);
  });

  it('returns a number for any input', () => {
    const testIds = ['abc', 'xyz', '123', 'test-pin', 'another-pin-id', ''];

    for (const id of testIds) {
      const rotation = getRotation(id);
      expect(typeof rotation).toBe('number');
      expect(Number.isFinite(rotation)).toBe(true);
    }
  });

  it('produces small rotation values suitable for visual display', () => {
    // The function should produce values small enough for subtle pin tilts
    // Typically within a few degrees
    const testIds = ['pin-1', 'pin-2', 'pin-3'];

    for (const id of testIds) {
      const rotation = getRotation(id);
      // Should be within reasonable visual range (< 10 degrees)
      expect(Math.abs(rotation)).toBeLessThan(10);
    }
  });

  it('handles empty string', () => {
    const rotation = getRotation('');
    expect(typeof rotation).toBe('number');
    expect(Number.isFinite(rotation)).toBe(true);
  });

  it('handles special characters in id', () => {
    const rotation = getRotation('pin-with-special-!@#$%^&*()');
    expect(typeof rotation).toBe('number');
    expect(Number.isFinite(rotation)).toBe(true);
  });

  it('handles UUID-style ids', () => {
    const rotation = getRotation('550e8400-e29b-41d4-a716-446655440000');
    expect(typeof rotation).toBe('number');
    expect(Number.isFinite(rotation)).toBe(true);
  });

  it('larger range parameter produces potentially wider rotation values', () => {
    // With larger range, values can be bigger
    const smallRangeRotation = getRotation('test-id', 20);
    const largeRangeRotation = getRotation('test-id', 100);
    // They will be different due to different divisors
    expect(smallRangeRotation).not.toBe(largeRangeRotation);
  });
});
