import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BriefingPin } from './BriefingPin';

describe('BriefingPin', () => {
  it('renders supported formatting without injecting raw HTML', () => {
    const { container } = render(
      <BriefingPin
        pin={{
          id: 'briefing-pin',
          type: 'briefing',
          title: 'Morning Briefing',
          status: 'active',
          createdAt: '2026-04-02T08:00:00.000Z',
          updatedAt: '2026-04-02T08:00:00.000Z',
          content: '## Weather\nSunny with **clear skies**\n\n- Inbox zero\n- Review PR\n\n<script>alert(1)</script>',
        }}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('clear skies')).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('clear skies');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});
