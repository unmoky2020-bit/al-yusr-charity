import { useEffect, useState } from "react";

/** Longest a visitor waits for the dashboard content before a page shows its built-in copy. */
export const CONTENT_MAX_WAIT_MS = 8000;

/** The two fields of a React Query result that tell a first load from a refetch after a failure. */
export type FirstLoadQuery = { isLoading: boolean; errorUpdatedAt: number };

/**
 * True only while a query loads for the FIRST time, so a page can show its loading state instead of
 * flashing the built-in copy before the dashboard content arrives. Never true:
 *  - after the query has failed once: React Query puts a failed query with no data back to "pending"
 *    whenever a newly mounted component refetches it, so a page gated on plain `isLoading` would
 *    loop between its loading state and its content for as long as the API is down;
 *  - for longer than `maxWait`: a slow API never keeps a page blank (the content swaps in on arrival).
 */
export function isFirstLoad(q: FirstLoadQuery): boolean {
  return q.isLoading && q.errorUpdatedAt === 0;
}

export function useFirstLoad(q: FirstLoadQuery, enabled = true, maxWait = CONTENT_MAX_WAIT_MS): boolean {
  const loading = enabled && isFirstLoad(q);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), maxWait);
    return () => window.clearTimeout(timer);
  }, [loading, maxWait]);
  return loading && !timedOut;
}
