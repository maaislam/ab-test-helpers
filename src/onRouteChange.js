// onRouteChange
// Re-fire your A/B test logic when a single page app changes route. Client side
// tools run their snippet once on the first load, so on an SPA the variation
// never re-applies after the user navigates. This detects navigation at the
// source by patching History once, plus popstate.
//
// `onUrlChange` is the fallback for when you cannot patch History (the host app
// already wraps it, another live experiment owns it, or the framework routes in
// a way the patch does not see). It infers navigation from DOM changes, so it is
// heavier: keep the callback cheap.
//
// Full write-up: https://arafatcro.dev/guides/optimizely-experiment-not-firing-spa-route-changes

const ROUTE_EVENT = "abRouteChange";

function patchHistory() {
  if (window.__abHistoryPatched) return; // never stack patches across experiments
  window.__abHistoryPatched = true;
  const fire = () => window.dispatchEvent(new Event(ROUTE_EVENT));
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      fire();
      return result;
    };
  }
  window.addEventListener("popstate", fire);
}

// Primary. Patch History once, then call `callback` on every navigation.
// Returns an unsubscribe function. Does not fire on the initial load: run your
// init once yourself, then let this handle every route after it.
function onRouteChange(callback) {
  patchHistory();
  window.addEventListener(ROUTE_EVENT, callback);
  return () => window.removeEventListener(ROUTE_EVENT, callback);
}

// Fallback. Infer navigation from DOM changes. One URL check per mutation batch,
// not per mutation. Returns an unsubscribe function.
function onUrlChange(callback) {
  let previousUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href === previousUrl) return;
    previousUrl = location.href;
    callback();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}

// usage
// const run = () => { teardown(); /* re-apply the variation for this view */ };
// run();                 // first load
// onRouteChange(run);    // every navigation after

export { onRouteChange, onUrlChange };
