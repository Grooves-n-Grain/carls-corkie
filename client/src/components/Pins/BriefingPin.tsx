import { Fragment } from 'react';
import type { Pin } from '../../types/pin';
import './BriefingPin.css';

interface BriefingPinProps {
  pin: Pin;
  onDismiss: () => void;
}

export function BriefingPin({ pin, onDismiss }: BriefingPinProps) {
  const renderInline = (text: string) =>
    text.split(/(\*\*.+?\*\*)/g).filter(Boolean).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      return <Fragment key={index}>{part}</Fragment>;
    });

  const renderContent = (text: string) => {
    const blocks: Array<
      | { type: 'h3' | 'h4'; text: string }
      | { type: 'hr' }
      | { type: 'ul'; items: string[] }
      | { type: 'p'; lines: string[] }
    > = [];
    const lines = text.split('\n');
    let paragraph: string[] = [];
    let listItems: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length > 0) {
        blocks.push({ type: 'p', lines: [...paragraph] });
        paragraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        blocks.push({ type: 'ul', items: [...listItems] });
        listItems = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        flushParagraph();
        flushList();
        continue;
      }

      if (trimmed === '---') {
        flushParagraph();
        flushList();
        blocks.push({ type: 'hr' });
        continue;
      }

      if (trimmed.startsWith('### ')) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'h4', text: trimmed.slice(4) });
        continue;
      }

      if (trimmed.startsWith('## ')) {
        flushParagraph();
        flushList();
        blocks.push({ type: 'h3', text: trimmed.slice(3) });
        continue;
      }

      if (trimmed.startsWith('- ')) {
        flushParagraph();
        listItems.push(trimmed.slice(2));
        continue;
      }

      if (listItems.length > 0) {
        flushList();
      }

      paragraph.push(line);
    }

    flushParagraph();
    flushList();

    return blocks.map((block, index) => {
      switch (block.type) {
        case 'h3':
          return <h3 key={index}>{renderInline(block.text)}</h3>;
        case 'h4':
          return <h4 key={index}>{renderInline(block.text)}</h4>;
        case 'hr':
          return <hr key={index} />;
        case 'ul':
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        case 'p':
          return (
            <p key={index}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                  {lineIndex > 0 ? <br /> : null}
                  {renderInline(line)}
                </Fragment>
              ))}
            </p>
          );
      }
    });
  };

  return (
    <article
      className="briefing-pin"
      aria-label={`Briefing: ${pin.title}`}
    >
      {/* Dismiss pushpin */}
      <button
        className="briefing-pin__dismiss"
        onClick={onDismiss}
        title="Dismiss briefing"
        aria-label="Dismiss briefing"
      />

      {/* Header */}
      <header className="briefing-pin__header">
        <span className="briefing-pin__icon">☀️</span>
        <h2 className="briefing-pin__title">{pin.title}</h2>
      </header>

      {/* Content */}
      {pin.content && (
        <div className="briefing-pin__content">
          {renderContent(pin.content)}
        </div>
      )}

      {/* Footer */}
      <footer className="briefing-pin__footer">
        <span className="briefing-pin__timestamp">
          {new Date(pin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </footer>
    </article>
  );
}
