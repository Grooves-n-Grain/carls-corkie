import { describe, expect, it } from 'vitest';
import {
  buildGitHubRepoUrl,
  buildGmailMessageUrl,
  getSafeHostname,
  getSafeHttpUrl,
} from './urlUtils';

describe('urlUtils', () => {
  it('allows absolute http and https URLs', () => {
    expect(getSafeHttpUrl('https://example.com/docs')).toBe('https://example.com/docs');
    expect(getSafeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects non-http protocols and malformed URLs', () => {
    expect(getSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(getSafeHttpUrl('data:text/html,boom')).toBeNull();
    expect(getSafeHttpUrl('not-a-url')).toBeNull();
  });

  it('extracts a hostname only from safe URLs', () => {
    expect(getSafeHostname('https://www.example.com/path')).toBe('example.com');
    expect(getSafeHostname('javascript:alert(1)')).toBeNull();
  });

  it('builds safe GitHub and Gmail URLs', () => {
    expect(buildGitHubRepoUrl('openai/codex')).toBe('https://github.com/openai/codex');
    expect(buildGitHubRepoUrl('missing-slash')).toBeNull();
    expect(buildGmailMessageUrl('message id')).toBe('https://mail.google.com/mail/u/0/#inbox/message%20id');
  });
});
