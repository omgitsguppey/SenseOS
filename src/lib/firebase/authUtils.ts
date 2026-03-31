import { auth } from './config';

let cachedTokenPromise: Promise<string> | null = null;
let tokenCacheTimeout: NodeJS.Timeout | null = null;

export async function getAuthToken(): Promise<string | undefined> {
  if (!auth.currentUser) return undefined;
  if (cachedTokenPromise) return cachedTokenPromise;

  cachedTokenPromise = auth.currentUser.getIdToken();
  tokenCacheTimeout = setTimeout(() => {
    cachedTokenPromise = null;
    tokenCacheTimeout = null;
  }, 50); // Brief cache to batch concurrent sync requests

  return cachedTokenPromise;
}
