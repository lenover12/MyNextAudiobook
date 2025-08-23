export function canUseNavigator(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator)) return false;
  return true;
}