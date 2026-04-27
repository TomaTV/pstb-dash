/**
 * Shared in-memory session store for BFM stream cookies.
 * Module-level state is shared across requests in the same Next.js server process.
 */

/** @type {Record<string, { url: string, cookies: string, ts: number }>} */
export const bfmSession = {};
