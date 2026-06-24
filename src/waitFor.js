// waitFor(selectorOrPredicate, callback, timeoutMs?)
//
// Wait for a DOM element or an arbitrary condition, then fire `callback` once.
// Two argument shapes, same helper, same polling cadence:
//
//   1. CSS selector (string): polls `document.querySelector(selector)` and fires
//      `callback(element)` on the first match.
//   2. Predicate (function): polls `predicate()` and fires `callback(null)` when
//      it returns truthy. Use predicates for non-DOM waits, e.g.
//      `() => typeof window.tealiumDataLayer === 'object'`, multi-element
//      readiness, or app-state checks.
//
// Both shapes share:
//   - 50ms poll cadence (cheap, within the perceptual threshold)
//   - `timeoutMs` (default 5000): silent give-up, callback never fires
//   - try/catch around the selector lookup, the predicate, AND the callback, so
//     variant code can never break the host page
//   - single-fire: a `done` flag stops the callback running twice, even if the
//     element is later removed or the predicate flips back
//
// Returns a `cancel()` function to stop early. `waitForElement` is an alias.
//
// Full write-up: https://arafatcro.dev/guides/waitforelement-ab-test

function waitFor(selectorOrPredicate, callback, timeoutMs = 5000) {
  const isPredicate = typeof selectorOrPredicate === "function";
  const started = Date.now();
  let done = false;

  const cancel = () => { done = true; clearInterval(poll); };

  const poll = setInterval(() => {
    if (done) return;

    let hit = null;
    try {
      hit = isPredicate
        ? (selectorOrPredicate() ? true : null)
        : document.querySelector(selectorOrPredicate);
    } catch (e) {
      hit = null; // a thrown selector or predicate just means "not ready yet"
    }

    if (hit) {
      done = true;
      clearInterval(poll);
      try {
        callback(isPredicate ? null : hit);
      } catch (e) {
        // never let variant code break the host page
      }
      return;
    }

    if (Date.now() - started >= timeoutMs) {
      done = true;
      clearInterval(poll); // silent give-up: callback never fires
    }
  }, 50);

  return cancel;
}

// usage
// waitFor('[data-qa="add-to-basket"]', (el) => { /* apply the variation */ });
// waitFor(() => window.dataLayer?.length > 0, () => track('ready'));
// const cancel = waitFor('.late', apply); // cancel() to stop early

export { waitFor, waitFor as waitForElement };
