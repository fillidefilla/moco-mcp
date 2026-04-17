/**
 * MOCO API client.
 *
 * Handles authentication, pagination, and rate limiting for the
 * MOCO REST API at https://{subdomain}.mocoapp.com/api/v1/.
 */

const MOCO_SUBDOMAIN = process.env.MOCO_SUBDOMAIN;
const MOCO_API_KEY = process.env.MOCO_API_KEY;

export function getBaseUrl(): string {
  if (!MOCO_SUBDOMAIN) {
    throw new Error(
      "MOCO_SUBDOMAIN environment variable is not set. " +
        "Set it to your MOCO subdomain (the part before .mocoapp.com).",
    );
  }
  return `https://${MOCO_SUBDOMAIN}.mocoapp.com/api/v1`;
}

export function getHeaders(): Record<string, string> {
  if (!MOCO_API_KEY) {
    throw new Error(
      "MOCO_API_KEY environment variable is not set. " +
        "Get your API key from MOCO: Profile > Integrations > API.",
    );
  }
  return {
    Authorization: `Token token=${MOCO_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
}

/**
 * Fetch a single page from the MOCO API.
 */
export async function fetchPage<T>(
  path: string,
  params: Record<string, string> = {},
  page = 1,
): Promise<PaginatedResponse<T>> {
  const url = new URL(`${getBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set("page", String(page));

  const response = await fetch(url.toString(), { headers: getHeaders() });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MOCO API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as T[];
  const total = parseInt(response.headers.get("x-total") ?? "0", 10);
  const perPage = parseInt(response.headers.get("x-per-page") ?? "100", 10);
  const currentPage = parseInt(response.headers.get("x-page") ?? "1", 10);

  return { data, page: currentPage, perPage, total };
}

/**
 * Fetch all pages from a paginated MOCO API endpoint.
 *
 * Collects results across pages until there are no more. Use with
 * caution on large datasets - prefer filtering with query params.
 */
export async function fetchAll<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const allResults: T[] = [];
  let page = 1;

  while (true) {
    const result = await fetchPage<T>(path, params, page);
    allResults.push(...result.data);

    if (allResults.length >= result.total || result.data.length === 0) {
      break;
    }

    page++;
  }

  return allResults;
}

/**
 * Fetch a single resource by ID.
 */
export async function fetchOne<T>(path: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, { headers: getHeaders() });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`MOCO API error ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}
