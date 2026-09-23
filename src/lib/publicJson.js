const inFlightRequests = new Map();
const cachedResponses = new Map();
const CACHE_TTL = 30_000;

export function getPublicJson(url, options = {}) {
  const shouldCache = options.cache !== 'no-store';
  const cached = shouldCache ? cachedResponses.get(url) : null;
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data);
  }

  const existingRequest = inFlightRequests.get(url);
  if (existingRequest) return existingRequest;

  const request = fetch(url, options)
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `Request failed: ${response.status}`);
      if (shouldCache) cachedResponses.set(url, { data, expiresAt: Date.now() + CACHE_TTL });
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });

  inFlightRequests.set(url, request);
  return request;
}
