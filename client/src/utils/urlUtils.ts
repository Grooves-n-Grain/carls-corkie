const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function getSafeHttpUrl(value?: string | null): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function getSafeHostname(value?: string | null): string | null {
  const safeUrl = getSafeHttpUrl(value);
  if (!safeUrl) return null;

  return new URL(safeUrl).hostname.replace(/^www\./, '');
}

export function openSafeExternalUrl(value?: string | null): boolean {
  const safeUrl = getSafeHttpUrl(value);
  if (!safeUrl) return false;

  window.open(safeUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export function buildGitHubRepoUrl(repo?: string | null): string | null {
  if (typeof repo !== 'string') return null;

  const segments = repo
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  return `https://github.com/${segments.map(encodeURIComponent).join('/')}`;
}

export function buildGmailMessageUrl(emailId?: string | null): string | null {
  if (typeof emailId !== 'string' || emailId.trim() === '') {
    return null;
  }

  return `https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(emailId)}`;
}
