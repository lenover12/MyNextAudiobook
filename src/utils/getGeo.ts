let cachedCountry: string | null = null;

export async function getCountryCode(): Promise<string> {
  if (cachedCountry) return cachedCountry;
  try {
    const res = await fetch('https://ipapi.co/json');
    const data = await res.json();
    //fallback is US
    return data.country || 'us';
  } catch (e) {
    console.warn('Failed to fetch country code:', e);
    return 'us';
  }
}
