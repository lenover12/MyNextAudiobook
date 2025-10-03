export type ConsentChoice = "accepted_all" | "necessary_only";

const STORAGE_KEY = "mynextaudiobook-consent";

export function getStoredConsent(): ConsentChoice | null {
  try { return (localStorage.getItem(STORAGE_KEY) as ConsentChoice) ?? null; } catch { return null; }
}
export function storeConsent(choice: ConsentChoice) {
  try { localStorage.setItem(STORAGE_KEY, choice); } catch {}
}

function ensureGtagShim() {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = (window as any).gtag || function gtag(){ (window as any).dataLayer.push(arguments); };
}

export function initConsentModeDefault() {
  ensureGtagShim();
  (window as any).gtag("consent", "default", {
    ad_user_data: "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });
}

export function applyConsent(choice: ConsentChoice) {
  ensureGtagShim();
  const granted = choice === "accepted_all";
  (window as any).gtag("consent", "update", {
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: "denied",
    ad_storage: "denied",
    analytics_storage: granted ? "granted" : "denied"
  });
}

export function loadGA(analyticsId: string) {
  if (!analyticsId) return;
  if (document.getElementById("ga-script")) return;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  s.id = "ga-script";
  document.head.appendChild(s);

  ensureGtagShim();
  (window as any).gtag("js", new Date());

  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    (window as any).gtag("set", "debug_mode", true);
  }
  (window as any).gtag("config", analyticsId);
}

export function unloadGA(analyticsId?: string) {
  if (analyticsId) (window as any)[`ga-disable-${analyticsId}`] = true;

  const el = document.getElementById("ga-script");
  if (el?.parentNode) el.parentNode.removeChild(el);
}

export function setConsentFromToggle(enabled: boolean, analyticsId: string) {
  const choice: ConsentChoice = enabled ? "accepted_all" : "necessary_only";
  storeConsent(choice);
  applyConsent(choice);
  if (enabled) {
    (window as any)[`ga-disable-${analyticsId}`] = false;
    loadGA(analyticsId);
  } else {
    unloadGA(analyticsId);
  }
}

export function bootstrapAnalytics(analyticsId: string) {
  initConsentModeDefault();
  const choice = getStoredConsent();
  if (choice) {
    applyConsent(choice);
    if (choice === "accepted_all") loadGA(analyticsId);
  }
}

export function needsConsent(): boolean {
  return !getStoredConsent();
}
