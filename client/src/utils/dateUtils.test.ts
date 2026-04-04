import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTimeAgo, formatEmailDate } from './dateUtils';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    // Mock Date.now to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const thirtySecondsAgo = new Date('2024-06-15T11:59:30.000Z').toISOString();
    expect(formatTimeAgo(thirtySecondsAgo)).toBe('just now');
  });

  it('returns minutes ago for times less than an hour ago', () => {
    const fiveMinutesAgo = new Date('2024-06-15T11:55:00.000Z').toISOString();
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('5m ago');

    const thirtyMinutesAgo = new Date('2024-06-15T11:30:00.000Z').toISOString();
    expect(formatTimeAgo(thirtyMinutesAgo)).toBe('30m ago');
  });

  it('returns hours ago for times less than a day ago', () => {
    const twoHoursAgo = new Date('2024-06-15T10:00:00.000Z').toISOString();
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago');

    const twentyThreeHoursAgo = new Date('2024-06-14T13:00:00.000Z').toISOString();
    expect(formatTimeAgo(twentyThreeHoursAgo)).toBe('23h ago');
  });

  it('returns days ago for times less than a week ago', () => {
    const twoDaysAgo = new Date('2024-06-13T12:00:00.000Z').toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago');

    const sixDaysAgo = new Date('2024-06-09T12:00:00.000Z').toISOString();
    expect(formatTimeAgo(sixDaysAgo)).toBe('6d ago');
  });

  it('returns locale date string for times more than a week ago', () => {
    const twoWeeksAgo = new Date('2024-06-01T12:00:00.000Z').toISOString();
    const result = formatTimeAgo(twoWeeksAgo);
    // Should be a date string, not a relative time
    expect(result).not.toContain('ago');
    expect(result).not.toBe('just now');
  });
});

describe('formatEmailDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for undefined input', () => {
    expect(formatEmailDate(undefined)).toBe('');
  });

  it('returns empty string for empty string input', () => {
    expect(formatEmailDate('')).toBe('');
  });

  it('returns "Just now" for times less than an hour ago', () => {
    const thirtyMinutesAgo = new Date('2024-06-15T11:30:00.000Z').toISOString();
    expect(formatEmailDate(thirtyMinutesAgo)).toBe('Just now');
  });

  it('returns hours ago for times less than a day ago', () => {
    const twoHoursAgo = new Date('2024-06-15T10:00:00.000Z').toISOString();
    expect(formatEmailDate(twoHoursAgo)).toBe('2h ago');
  });

  it('returns days ago for times less than a week ago', () => {
    const threeDaysAgo = new Date('2024-06-12T12:00:00.000Z').toISOString();
    expect(formatEmailDate(threeDaysAgo)).toBe('3d ago');
  });

  it('returns abbreviated date for times more than a week ago', () => {
    const twoWeeksAgo = new Date('2024-06-01T12:00:00.000Z').toISOString();
    const result = formatEmailDate(twoWeeksAgo);
    // Should contain month abbreviation and day number
    expect(result).toMatch(/Jun\s+1/);
  });

  it('handles invalid date strings by returning a string', () => {
    // Note: Invalid date strings don't throw in JS, they return 'Invalid Date'
    // The function returns a string (may be 'Invalid Date')
    const result = formatEmailDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});
