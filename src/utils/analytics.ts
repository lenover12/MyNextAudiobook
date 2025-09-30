declare global {
  interface Window { gtag?: (...args: any[]) => void }
}
type Params = Record<string, any>;

export function trackEvent(name: string, params?: Params) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

//normalize to one id (asin || itunesId)
export function toBookId(obj: { asin?: string | null; itunesId?: string | number | null } | null | undefined) {
  if (!obj) return null;
  const id = (obj.asin ?? obj.itunesId)?.toString() ?? null;
  return id;
}
