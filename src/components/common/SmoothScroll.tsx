/**
 * Smooth-scroll has been disabled per user request to remove the
 * scroll "tightening" from start to end. Native browser scrolling is
 * lighter, snappier, and avoids Lenis interfering with GSAP timelines
 * and IntersectionObservers on mobile.
 */
export const SmoothScroll = () => null;

export default SmoothScroll;
