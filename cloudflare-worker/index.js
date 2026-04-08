// Cloudflare Worker — Audible API proxy
// Paste this into the Cloudflare Workers editor (workers.cloudflare.com)
// Routes:
//   /search?keywords=...&region=au&limit=50
//   /book/{asin}?region=au

const REGION_HOSTS = {
  us: 'api.audible.com',
  uk: 'api.audible.co.uk',
  de: 'api.audible.de',
  fr: 'api.audible.fr',
  au: 'api.audible.com.au',
  ca: 'api.audible.ca',
  in: 'api.audible.in',
  it: 'api.audible.it',
  jp: 'api.audible.co.jp',
  es: 'api.audible.es',
};

const RESPONSE_GROUPS =
  'media,product_attrs,product_desc,product_extended_attrs,product_plans,rating,series,category_ladders';

const AUDIBLE_HEADERS = {
  'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 15); com.audible.application',
  'Accept': 'application/json',
  'Accept-Charset': 'utf-8',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const region = url.searchParams.get('region') ?? 'us';
    const host = REGION_HOSTS[region] ?? REGION_HOSTS.us;
    const path = url.pathname;

    let audibleUrl;

    if (path === '/search') {
      const keywords = url.searchParams.get('keywords') ?? '';
      const limit = url.searchParams.get('limit') ?? '50';
      const params = new URLSearchParams({
        keywords,
        num_results: limit,
        response_groups: RESPONSE_GROUPS,
        products_sort_by: 'Relevance',
      });
      audibleUrl = `https://${host}/1.0/catalog/products/?${params}`;

    } else if (path.startsWith('/book/')) {
      const asin = path.slice('/book/'.length);
      const params = new URLSearchParams({ response_groups: RESPONSE_GROUPS });
      audibleUrl = `https://${host}/1.0/catalog/products/${encodeURIComponent(asin)}?${params}`;

    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS_HEADERS });
    }

    try {
      const response = await fetch(audibleUrl, { headers: AUDIBLE_HEADERS });
      const body = await response.text();
      return new Response(body, { status: response.status, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS });
    }
  },
};
