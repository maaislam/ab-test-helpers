// onElementVisible
// Fire a callback the first time an element scrolls into view, using an
// IntersectionObserver. Useful for impression tracking, lazy-applied variations,
// and scroll-triggered changes. Fires once per element by default, then stops
// watching it. Returns a teardown function.

function onElementVisible(target, callback, {
  threshold = 0.5,   // fraction of the element that must be visible
  once = true,
  root = null,       // null = the viewport
  rootMargin = "0px",
} = {}) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return () => {};

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        callback(entry.target, entry);
        if (once) observer.unobserve(entry.target);
      }
    }
  }, { threshold, root, rootMargin });

  observer.observe(el);
  return () => observer.disconnect();
}

// usage
// onElementVisible('.pricing-table', () => track('pricing_seen'));

export { onElementVisible };
