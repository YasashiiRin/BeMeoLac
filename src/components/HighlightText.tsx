import React from 'react';
import { findMatches } from '../utils/text';

/** Renders `text` with every (accent-insensitive) match of `query` softly highlighted. */
export const HighlightText: React.FC<{ text: string; query?: string; className?: string }> = ({ text, query, className = '' }) => {
  const ranges = query ? findMatches(text, query) : [];
  if (!ranges.length) return <>{text}</>;
  const chars = Array.from(text);
  const parts: React.ReactNode[] = [];
  let last = 0;
  ranges.forEach(([start, end], i) => {
    if (start > last) parts.push(chars.slice(last, start).join(''));
    parts.push(
      <mark key={i} className={`bg-gold-tint text-gold-ink rounded px-0.5 ${className}`}>
        {chars.slice(start, end).join('')}
      </mark>
    );
    last = end;
  });
  if (last < chars.length) parts.push(chars.slice(last).join(''));
  return <>{parts}</>;
};
