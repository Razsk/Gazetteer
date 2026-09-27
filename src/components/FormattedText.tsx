'use client';

import React from 'react';

export interface FormattedTextProps {
  content?: string | string[] | unknown;
  className?: string;
  listStyle?: 'bullet' | 'numbered';
}

// Regex to identify list item prefixes:
// Bullet points: *, -, +, •
// Numbered/Lettered: 1., 2., 10., 1), 2), a., b., etc.
const LIST_ITEM_REGEX = /^\s*(?:[\*\-•\+]|\d+[\.\)]|[a-zA-Z][\.\)])\s+(.*)$/;

/**
 * Pre-processes raw text to split single-line lists (e.g. "* item 1 * item 2" or "1. item 1 2. item 2")
 * into distinct lines, while preserving normal paragraphs and line breaks.
 */
function preprocessText(raw: string): string[] {
  const rawLines = raw.split('\n');
  const lines: string[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      lines.push('');
      continue;
    }

    // Single-line numbered lists: e.g. "1. First 2. Second" or "Actions: 1. First 2. Second"
    const numberedMatch = line.match(/^(?:(.*?:\s*))?1[\.\)]\s+(.*?\s+2[\.\)]\s+.*)$/);
    if (numberedMatch) {
      const prefix = numberedMatch[1]?.trim();
      if (prefix) lines.push(prefix);
      const listPart = '1. ' + numberedMatch[2];
      const items = listPart.split(/\s+(?=\d+[\.\)]\s+)/);
      lines.push(...items);
      continue;
    }

    // Single-line bullet lists: e.g. "* First * Second" or "Actions: * First * Second"
    const bulletMatch = line.match(/^(?:(.*?:\s*))?[\*•\-]\s+(.*?\s+[\*•\-]\s+.*)$/);
    if (bulletMatch) {
      const prefix = bulletMatch[1]?.trim();
      if (prefix) lines.push(prefix);
      const listPart = '* ' + bulletMatch[2];
      const items = listPart.split(/\s+(?=[\*•\-]\s+)/);
      lines.push(...items);
      continue;
    }

    lines.push(line);
  }

  return lines;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`.
 */
export function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split on markdown bold (**...**), italic (*...*), or code (`...`)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

type TextBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; items: { text: string; isIndented: boolean }[] };

/**
 * FormattedText component
 * Automatically detects and formats text lists with * or 1. 2. 3. etc. into stylized bullet lists.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ content, className, listStyle = 'bullet' }) => {
  if (content == null || content === '') {
    return null;
  }

  // If content is an array of strings or items
  if (Array.isArray(content)) {
    if (content.length === 0) return null;
    return (
      <ul className={`my-1 space-y-1 list-none ${className || ''}`}>
        {content.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5 leading-snug">
            {listStyle === 'numbered' ? (
              <span
                className="font-mono text-[11px] font-semibold opacity-75 shrink-0 min-w-[16px] text-right"
                aria-hidden="true"
              >
                {idx + 1}.
              </span>
            ) : (
              <span
                className="select-none text-current opacity-60 shrink-0 mt-[1px] text-[10px]"
                aria-hidden="true"
              >
                •
              </span>
            )}
            <span className="flex-1 min-w-0">{renderInline(String(item))}</span>
          </li>
        ))}
      </ul>
    );
  }

  const rawString = typeof content === 'string' ? content : String(content);
  const normalized = rawString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = preprocessText(normalized);

  const blocks: TextBlock[] = [];
  let currentList: { text: string; isIndented: boolean }[] | null = null;
  let currentParagraphLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      blocks.push({ type: 'paragraph', lines: [...currentParagraphLines] });
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] });
      currentList = null;
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const listMatch = line.match(LIST_ITEM_REGEX);
    if (listMatch) {
      flushParagraph();
      if (!currentList) currentList = [];
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      currentList.push({
        text: listMatch[1],
        isIndented: leadingSpaces >= 2,
      });
    } else {
      flushList();
      currentParagraphLines.push(line);
    }
  }

  flushParagraph();
  flushList();

  if (blocks.length === 0) {
    return null;
  }

  // Optimization: If it's just a single paragraph line without any lists
  if (blocks.length === 1 && blocks[0].type === 'paragraph' && blocks[0].lines.length === 1) {
    return (
      <span className={className ? `${className} leading-snug` : 'leading-snug'}>
        {renderInline(blocks[0].lines[0])}
      </span>
    );
  }

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'list') {
          return (
            <ul key={bIdx} className="my-1 space-y-1 list-none">
              {block.items.map((item, iIdx) => (
                <li
                  key={iIdx}
                  className={`flex items-start gap-1.5 leading-snug ${
                    item.isIndented ? 'pl-3.5 opacity-90' : ''
                  }`}
                >
                  {listStyle === 'numbered' ? (
                    <span
                      className="font-mono text-[11px] font-semibold opacity-75 shrink-0 min-w-[16px] text-right"
                      aria-hidden="true"
                    >
                      {iIdx + 1}.
                    </span>
                  ) : (
                    <span
                      className="select-none text-current opacity-60 shrink-0 mt-[1px] text-[10px]"
                      aria-hidden="true"
                    >
                      •
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    {renderInline(item.text)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={bIdx} className="space-y-0.5">
            {block.lines.map((line, lIdx) => (
              <p key={lIdx} className="leading-snug">
                {renderInline(line)}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
};
