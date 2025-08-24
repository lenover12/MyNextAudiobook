import type { JSX } from 'react';
import { splitItunesTitle } from './itunesTitleFilter';

export function getTitleElements(
  rawTitle: string,
  maxSplits: number = 3,
  removeUnabridged = true
): JSX.Element[] {
  
  const split = splitItunesTitle(rawTitle, removeUnabridged);

  if (!split || split.length > maxSplits) {
    let cleanedTitle
    if (removeUnabridged) {
      cleanedTitle = rawTitle.replace(/[\[\(\{]\s*unabridged\s*[\]\)\}]/gi, '').trim();
    } else {
      cleanedTitle = rawTitle
    }
    return [
      <span key="single" style={{ display: 'block' }}>
        {cleanedTitle}
      </span>
    ];
  }

  return split.map((line, i) => (
    <span key={i} style={{ display: 'block' }}>
      {line}
    </span>
  ));
}

export function processTitle(rawTitle: string, maxSplits = 3, removeUnabridged = true) {
  const jsx = getTitleElements(rawTitle, maxSplits, removeUnabridged);
  const cleaned = removeUnabridged
    ? rawTitle.replace(/[\[\(\{]\s*unabridged\s*[\]\)\}]/gi, '').trim()
    : rawTitle;

  return { jsx, cleaned };
}
