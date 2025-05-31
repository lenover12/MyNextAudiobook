export function pruneString(str: string): string {
  if (str.length >= 3) {
    return str.slice(1, -1);
  } else if (str.length === 2) {
    return Math.random() <0.5 ? str[0] : str[1];
  } else {
    return str;
  }
}