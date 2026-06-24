// hideUntilApplied
// Element scoped anti-flicker. Hide ONLY the elements your variation changes,
// never the whole page, then reveal the moment you have applied the change. A
// short failsafe timeout reveals the element anyway if the test is slow or
// breaks, so you never leave a hole.
//
// Uses visibility:hidden, not display:none, so the element keeps its space and
// revealing it does not shove the layout into a Cumulative Layout Shift. Hiding
// the whole page is what kills Largest Contentful Paint: scope it to what you
// touch instead.
//
// Full write-up: https://arafatcro.dev/guides/stop-ab-test-flicker

function hideUntilApplied(selector, { timeout = 1000 } = {}) {
  const style = document.createElement("style");
  style.textContent = `${selector}{visibility:hidden!important}`;
  document.head.appendChild(style);
  const reveal = () => style.isConnected && style.remove();
  const failsafe = setTimeout(reveal, timeout);
  // Call the returned function once you have applied the variation.
  return () => {
    clearTimeout(failsafe);
    reveal();
  };
}

// usage (pairs with waitFor)
// const reveal = hideUntilApplied('[data-qa="hero-cta"]');
// waitFor('[data-qa="hero-cta"]', (el) => {
//   el.textContent = 'Start free trial';
//   reveal();
// });

export { hideUntilApplied };
