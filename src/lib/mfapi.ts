const MFAPI_TIMEOUT = 6000;
const navCache = new Map<string, any>();
const MAX_RETRIES = 1;

export async function fetchSchemeDetails(schemeCode: string, retryCount = 0) {
  const cached = navCache.get(schemeCode);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MFAPI_TIMEOUT);

  try {
    const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`mfapi.in returned ${response.status}`);
    const data = await response.json();
    navCache.set(schemeCode, data);
    return data;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('mfapi.in request timed out');
    }
    if (retryCount < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return fetchSchemeDetails(schemeCode, retryCount + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchSchemes(query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MFAPI_TIMEOUT);

  try {
    const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return (data as Array<{ schemeCode: number | string; schemeName: string }>).map((item) => ({
      schemeCode: String(item.schemeCode),
      schemeName: item.schemeName,
    }));
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('mfapi.in search timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
