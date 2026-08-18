export interface SanityQueryClient {
  fetch<T>(query: string, params: Record<string, unknown>): Promise<T>;
}

export async function fetchPublishedCollection<T>(
  query: string,
  chapterSlug: string,
  contentType: string,
  client: SanityQueryClient,
): Promise<T[]> {
  try {
    return await client.fetch<T[]>(query, { chapterSlug });
  } catch (error) {
    console.error(`[sanity] failed to fetch published ${contentType}`, error);
    return [];
  }
}

export async function fetchPublishedDocument<T>(
  query: string,
  params: Record<string, unknown>,
  contentType: string,
  client: SanityQueryClient,
): Promise<T | null> {
  try {
    return await client.fetch<T | null>(query, params);
  } catch (error) {
    console.error(`[sanity] failed to fetch published ${contentType}`, error);
    return null;
  }
}
