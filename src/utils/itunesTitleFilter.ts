export function splitItunesTitle(title: string, removeUnabridged: boolean = false): string[] {
  const extractBracketGroups = (text: string): string[] => {
    const groups: string[] = [];
    const stack: string[] = [];
    let current = '';

    for (const c of text) {
      if (c === '(' || c === '[' || c === '{') {
        if (stack.length === 0 && current.trim()) {
          groups.push(current.trim());
          current = '';
        }
        current += c;
        stack.push(c);
      } else if (c === ')' || c === ']' || c === '}') {
        current += c;
        if (stack.length > 0) {
          stack.pop();
          if (stack.length === 0) {
            groups.push(current.trim());
            current = '';
          }
        }
      } else {
        current += c;
      }
    }

    if (current.trim()) {
      groups.push(current.trim());
    }

    return groups;
  };

  const finalSplit = (parts: string[]): string[] => {
    const final: string[] = [];

    for (const part of parts) {
      if (!part) continue;

      const isBracketed =
        (part.startsWith('(') && part.endsWith(')')) ||
        (part.startsWith('[') && part.endsWith(']')) ||
        (part.startsWith('{') && part.endsWith('}'));

      if (
        isBracketed &&
        removeUnabridged &&
        /^\s*[\[\(\{]\s*unabridged\s*[\]\)\}]\s*$/i.test(part)
      ) {
        continue;
      }

      if (isBracketed) {
        final.push(part.trim());
        continue;
      }

      if (part.includes(':') && !part.startsWith('(') && !part.startsWith('[') && !part.startsWith('{')) {
        const colonParts = part.split(/:(?![^()[\]{}]*[\)\]\}])/g);
        final.push(...colonParts.map(p => p.trim()).filter(Boolean));
        continue;
      }

      const match = part.match(/^(.*?),\s*(Book|Volume|Season|Episode)[\s\d-]+$/i);
      if (match) {
        final.push(match[1].trim());
        final.push(part.substring(match[1].length + 1).trim());
        continue;
      }

      final.push(part.trim());
    }

    return final;
  };

  return finalSplit(extractBracketGroups(title));
}
