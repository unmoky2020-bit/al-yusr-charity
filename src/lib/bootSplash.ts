/**
 * The boot splash (#boot-splash in index.html) covers the page from the first byte until the first
 * real page is on screen. Without it a visitor saw up to four screens in a row: the crawler summary
 * that seo.php puts inside #root, the route fallback, the page's own loading state, then the page.
 *
 * It goes away once #root holds rendered content with no `[data-page-loading]` element inside
 * (PageLoadingState marks itself so), or after `maxWaitMs` so a stuck request never hides the site.
 * Only React's own commits are checked: the crawler summary is never mistaken for a ready page.
 */
export const PAGE_LOADING_ATTR = "data-page-loading";

export function releaseBootSplashWhenReady(root: HTMLElement, maxWaitMs = 12_000): void {
  const splash = document.getElementById("boot-splash");
  if (!splash) return;

  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    window.clearTimeout(timer);
    splash.classList.add("is-hidden");
    window.setTimeout(() => splash.remove(), 400);
  };
  const ready = () => root.childElementCount > 0 && !root.querySelector(`[${PAGE_LOADING_ATTR}]`);

  const observer = new MutationObserver(() => {
    if (ready()) hide();
  });
  observer.observe(root, { childList: true, subtree: true });
  const timer = window.setTimeout(hide, maxWaitMs);
}
